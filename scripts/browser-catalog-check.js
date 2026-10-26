async () => {
 const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
 const original=window.fetch;
 const item={id:42,title:'Compatibility Test Movie',name:'Compatibility Test Movie',media_type:'movie',poster_path:'/fixture.jpg',backdrop_path:'/fixture.jpg',release_date:'2020-01-01',vote_average:7.5,overview:'Local fixture, no real API key or provider.',genres:[],credits:{cast:[]},similar:{results:[]},videos:{results:[]},external_ids:{}};
 window.fetch=function(url,options){
  if(String(url).includes('api.themoviedb.org')) {
   var data=String(url).includes('/movie/42?')?item:{results:[item]};
   return Promise.resolve(new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}}));
  }
  return original.call(this,url,options);
 };
 localStorage.setItem('tflix_c47_tmdb_api_key','test-only-not-a-real-key');
 document.querySelector('[data-tab="movies"]').click();
 await new Promise(r=>setTimeout(r,300));
 assert(document.body.textContent.includes('Compatibility Test Movie'),'catalog renders');
 var card=document.querySelector('.media-card');assert(card,'catalog card');card.click();
 await new Promise(r=>setTimeout(r,300));
 assert(document.getElementById('details-play-btn'),'details renders');
 document.getElementById('details-play-btn').click();
 await new Promise(r=>setTimeout(r,700));
 assert(document.body.textContent.includes('Connect Stream Provider'),'lazy player loads with no installed provider');
 assert(window.c47Errors.length===0,window.c47Errors.join('; '));
 localStorage.removeItem('tflix_c47_tmdb_api_key');
 window.fetch=original;
 return {pass:true,catalog:true,details:true,lazyPlayer:true,errors:window.c47Errors};
}
