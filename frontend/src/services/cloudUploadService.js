import httpClient from '@/services/http/httpClient';

const POLL_INTERVAL_MS = 1200;
const MAX_POLL_ATTEMPTS = 35;

function createUploadError(message, code = 'UPLOAD_FAILED') {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getDevelopmentObjectKey(fileUrl) {
  if (!fileUrl) return '';

  try {
    const pathname = new URL(fileUrl, window.location.origin).pathname;
    const marker = '/cloud-upload/dev-mock/';
    const markerIndex = pathname.indexOf(marker);
    return markerIndex < 0
      ? ''
      : decodeURIComponent(pathname.slice(markerIndex + marker.length));
  } catch {
    return '';
  }
}

/** Lấy preview qua API có kiểm tra quyền bằng objectKey hoặc URL đã lưu. */
async function getProjectFilePreviewUrl(fileUrl, storedObjectKey) {
  if (!fileUrl) return '';
  const objectKey = storedObjectKey || getDevelopmentObjectKey(fileUrl);

  const response = await httpClient.get('/cloud-upload/download', {
    params: objectKey ? { objectKey } : { publicUrl: fileUrl },
    responseType: 'blob',
  });
  return URL.createObjectURL(response.data);
}

/** Mở file qua API đã xác thực; file cũ không có objectKey được tra bằng URL đã lưu. */
async function openProjectFile(fileUrl, storedObjectKey) {
  if (!fileUrl) throw createUploadError('Không tìm thấy đường dẫn tệp.', 'FILE_NOT_FOUND');
  const objectKey = storedObjectKey || getDevelopmentObjectKey(fileUrl);

  const openedWindow = window.open('about:blank', '_blank');
  if (!openedWindow) {
    throw createUploadError('Trình duyệt đang chặn cửa sổ mở tệp.', 'POPUP_BLOCKED');
  }

  openedWindow.opener = null;
  try {
    const response = await httpClient.get('/cloud-upload/download', {
      params: objectKey ? { objectKey } : { publicUrl: fileUrl },
      responseType: 'blob',
    });
    const objectUrl = URL.createObjectURL(response.data);
    openedWindow.location.href = objectUrl;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    openedWindow.close();
    throw error;
  }
}

async function getProjectFiles(projectId) {
  const response = await httpClient.get(`/cloud-upload/files/${projectId}`);
  return response.data?.data?.files || [];
}

async function waitForConfirmation(projectId, objectKey) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const files = await getProjectFiles(projectId);
    const file = files.find((item) => item.objectKey === objectKey);
    if (file?.status === 'completed') return file;
    if (file?.status === 'failed') {
      throw createUploadError('Máy chủ không xác nhận được tệp đã tải lên.', 'UPLOAD_CONFIRMATION_FAILED');
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw createUploadError(
    'Tệp vẫn đang được máy chủ xử lý. Hãy tải lại danh sách tệp sau ít phút.',
    'UPLOAD_PROCESSING',
  );
}

/** Upload tệp trực tiếp lên storage, sau đó chỉ trả thành công khi backend xác nhận. */
export async function uploadProjectFile({ projectId, file, fileType }) {
  if (!projectId || !file || !fileType) {
    throw createUploadError('Thiếu thông tin dự án hoặc tệp cần tải lên.', 'MISSING_UPLOAD_INFO');
  }

  const presignResponse = await httpClient.post('/cloud-upload/presigned-url', {
    projectId,
    originalName: file.name,
    fileType,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
  });
  const presign = presignResponse.data?.data;
  if (!presign?.uploadUrl || !presign?.objectKey) {
    throw createUploadError('Máy chủ không cấp URL tải tệp hợp lệ.', 'INVALID_PRESIGNED_URL');
  }

  const headers = Object.fromEntries(
    Object.entries(presign.headers || {}).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  let uploadResponse;
  try {
    uploadResponse = await fetch(presign.uploadUrl, {
      method: presign.method || 'PUT',
      headers,
      body: file,
      credentials: 'omit',
    });
  } catch (error) {
    throw createUploadError(error?.message || 'Không thể tải tệp lên kho lưu trữ.', 'STORAGE_UPLOAD_FAILED');
  }
  if (!uploadResponse.ok) {
    throw createUploadError(`Kho lưu trữ từ chối tệp (HTTP ${uploadResponse.status}).`, 'STORAGE_UPLOAD_FAILED');
  }

  const confirmResponse = await httpClient.post('/cloud-upload/confirm', {
    objectKey: presign.objectKey,
  });
  let confirmed = confirmResponse.data?.data;
  if (confirmed?.status === 'processing') {
    confirmed = await waitForConfirmation(projectId, presign.objectKey);
  }
  if (confirmed?.status !== 'completed' || !confirmed.publicUrl) {
    throw createUploadError('Backend chưa xác nhận tệp đã tải lên.', 'UPLOAD_NOT_CONFIRMED');
  }

  return {
    url: confirmed.publicUrl,
    publicUrl: confirmed.publicUrl,
    objectKey: confirmed.objectKey || presign.objectKey,
    fileName: confirmed.fileName || file.name,
    fileSize: confirmed.fileSize ?? file.size,
    mimeType: confirmed.mimeType || file.type || 'application/octet-stream',
    status: confirmed.status,
    uploadedAt: new Date().toISOString(),
  };
}

export default {
  uploadProjectFile,
  getProjectFiles,
  getProjectFilePreviewUrl,
  openProjectFile,
};
