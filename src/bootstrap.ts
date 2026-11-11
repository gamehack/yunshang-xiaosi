import './style.css';
const root=document.querySelector('#app');
if(root)root.innerHTML='<div class="scene-error" role="status">正在准备园林…</div>';
void import('./main').catch(()=>{
  if(root)root.innerHTML='<div class="scene-error" role="alert">园林暂时无法加载。请检查网络与浏览器硬件加速后刷新页面重试。</div>';
});
