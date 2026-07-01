
let db,items=[],current=0;
const open=indexedDB.open('hybrid-player',1);
open.onupgradeneeded=e=>e.target.result.createObjectStore('items',{keyPath:'id',autoIncrement:true});
open.onsuccess=e=>{db=e.target.result;load();};
files.onchange=e=>{let t=db.transaction('items','readwrite');let s=t.objectStore('items');[...e.target.files].forEach(f=>s.add({type:'local',name:f.name,file:f}));t.oncomplete=load;};
addUrl.onclick=()=>{let t=db.transaction('items','readwrite');t.objectStore('items').add({type:'stream',name:url.value,url:url.value});t.oncomplete=load;};
function load(){let r=db.transaction('items').objectStore('items').getAll();r.onsuccess=()=>{items=r.result;playlist.innerHTML='';items.forEach((x,i)=>{let d=document.createElement('div');d.textContent=x.name;d.onclick=()=>play(i);playlist.appendChild(d);});};}
function play(i){current=i;let x=items[i];audio.src=x.type==='local'?URL.createObjectURL(x.file):x.url;audio.play();}
