const fs=require('fs');
const files=['D:/sess-ctut/frontend/src/modules/mentoring/pages/MentorProfilePage.vue','D:/sess-ctut/frontend/src/modules/mentoring/pages/MentorDashboardPage.vue','D:/sess-ctut/frontend/src/modules/mentoring/pages/AssignedProjectsPage.vue','D:/sess-ctut/frontend/src/modules/mentoring/pages/TimelineMilestonesPage.vue','D:/sess-ctut/frontend/src/modules/mentoring/pages/MentoringEvaluationPage.vue','D:/sess-ctut/frontend/src/modules/mentoring/pages/NotificationsPage.vue'];
for (const fn of files){
  const s=fs.readFileSync(fn,'utf8');
  const m=s.match(/<template>([\s\S]*?)<\/template>/);
  if(!m){console.log(fn.split('/').pop()+':ERR');continue;}
  let t=m[1].replace(/<!--[\s\S]*?-->/g,'');
  const lines=t.split('\n').map(l=>l.trim()).filter(l=>l);
  const roots=lines.filter(l=>l.startsWith('<') && !l.startsWith('</') && !l.startsWith('<!'));
  console.log(fn.split('/').pop()+':'+roots.length+':'+(roots[0]?roots[0].slice(0,20):''));
}
