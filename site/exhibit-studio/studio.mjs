import {sourceExample,validate,readiness,transition,visitorMarkup,visitorDocument,curatorHandoff,TYPES,safeUrl} from "./core.mjs";
const $=id=>document.getElementById(id);
const wip=new Set(["source_supplied"]);
let world=sourceExample(),selected=world.order[0],db=null,revision=0,dirty=false,lang="en";
const notice=(message,error=false)=>{
 const toast=$("toast");toast.textContent=message;toast.style.background=error?"#eac3b9":"#d4e8cb";
 toast.classList.add("show");clearTimeout(notice.timer);notice.timer=setTimeout(()=>toast.classList.remove("show"),4400);
};
const safe=fn=>Promise.resolve().then(fn).catch(error=>notice(error.message||String(error),true));
const sel=()=>world.items.find(i=>i.id===selected);
function getDB(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open("aurekai-source-exhibit-drafts-v1",1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("exhibits"))req.result.createObjectStore("exhibits");};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error("Exhibit store unavailable."));
 });
}
const read=()=>new Promise((resolve,reject)=>{
 const t=db.transaction("exhibits","readonly"),req=t.objectStore("exhibits").get("teasdale");
 req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
});
const store=(expected,entity)=>new Promise((resolve,reject)=>{
 const t=db.transaction("exhibits","readwrite"),s=t.objectStore("exhibits"),req=s.get("teasdale");
 let next=0;
 req.onsuccess=()=>{
  const old=req.result;
  if((old?.saveRevision||0)!==expected){t.abort();return;}
  next=expected+1;s.put({saveRevision:next,world:structuredClone(entity)},"teasdale");
 };
 t.oncomplete=()=>resolve(next);
 t.onabort=()=>reject(Error("Another browser tab changed the exhibit. Reload before overwriting it."));
 t.onerror=()=>reject(t.error||Error("Cannot save source review."));
});
async function save(){
 if(!db)throw Error("Browser-local saving unavailable; export the typed proposal.");
 validate(world);revision=await store(revision,world);dirty=false;$("save").textContent="Saved ✓";
 notice("Exhibit interpretation, source IDs and review events saved locally.");
}
function mutate(action,data={}){
 world=transition(world,world.actor,action,data);
 dirty=true;$("save").textContent="Save exhibition •";
 render();return world;
}
function download(name,body,type="text/html"){
 const url=URL.createObjectURL(new Blob([body],{type})),a=document.createElement("a");
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
const html=(tag,cls,text)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;
};
function previewMedia(item){
 const container=document.createDocumentFragment();
 if(item.type==="image"&&item.media&&safeUrl(item.media)){
  const img=document.createElement("img");img.src=item.media;img.alt=item.title;img.loading="lazy";img.referrerPolicy="no-referrer";container.append(img);
 } else if(item.type==="audio"&&item.media&&safeUrl(item.media)){
  const audio=document.createElement("audio");audio.controls=true;audio.preload="none";audio.src=item.media;container.append(audio);
 } else container.append(html("p",null,"This item is presented as an original-source reference, not a reproduced media file."));
 return container;
}
function objects(){
 const list=$("objects");list.replaceChildren();
 for(const id of world.order){
  const item=world.items.find(i=>i.id===id);
  const button=html("button","object"+(item.id===selected?" selected":""));
  button.type="button";button.setAttribute("aria-pressed",String(item.id===selected));
  button.append(html("span","year",item.year+" · "+item.type),html("strong",null,item.title),
   html("span","source",item.source),html("span","badge",item.state.replaceAll("_"," ")));
  button.addEventListener("click",()=>{selected=item.id;$("rightsAttestation").checked=false;render();});
  list.append(button);
 }
}
function editor(){
 const item=sel();if(!item)return;
 $("objectTitle").textContent=item.title;
 $("objectDate").textContent=String(item.year);$("objectState").textContent=item.state.replaceAll("_"," ");
 $("objectLicense").textContent=item.license;
 $("mediaStage").replaceChildren(previewMedia(item));
 $("objectBody").value=item.body;
 $("objectCaption").value=item.caption;
 $("objectSpanish").value=item.language?.es||"";
 $("objectSource").href=item.source;$("objectSource").textContent=item.source;
 $("objectCredit").textContent=item.credit+" · "+item.license;
 const curator=world.actor===world.curator,rights=world.actor===world.rightsReviewer;
 for(const id of ["objectBody","objectCaption","objectSpanish","saveInterpretation"])
  $(id).disabled=!curator;
 $("moveUp").disabled=!curator||world.order.indexOf(item.id)===0;
 $("moveDown").disabled=!curator||world.order.indexOf(item.id)===world.order.length-1;
 $("sourceReview").disabled=!curator||item.state!=="source_supplied";
 $("sourceReview").textContent=item.state==="source_supplied"?"Review original source":"Source reviewed ✓";
 $("rightsClear").disabled=!rights||!$("rightsAttestation").checked||item.state==="source_supplied"||!["image","audio"].includes(item.type)||item.rights==="cleared";
 $("rightsRefuse").disabled=!rights||item.state==="source_supplied"||!["image","audio"].includes(item.type);
}
function visitor(){
 $("visitorTitle").textContent=world.title;$("visitorIntro").textContent=world.introduction;
 const root=$("visitorItems");root.replaceChildren();
 for(const id of world.order){
  const item=world.items.find(i=>i.id===id);
  const div=html("article","visitor-item");
  div.append(html("div","year",String(item.year)+" · "+item.tag),html("h3",null,item.title));
  div.append(html("p",null,lang==="es"&&item.language.es?item.language.es:item.body));
  div.append(previewMedia(item));
  const link=html("a",null,"Open original source ↗");link.href=item.source;link.target="_blank";link.rel="noopener noreferrer";
  const credit=html("small",null,item.credit+" · "+item.license+" · rights: "+item.rights);
  div.append(link,credit);root.append(div);
 }
}
function reviews(){
 const result=readiness(world),issues=$("issues");
 $("itemsMetric").textContent=result.count;$("reviewMetric").textContent=result.sourceReviewed;
 $("rightsMetric").textContent=result.rightsCleared;$("issuesMetric").textContent=result.issues.length;
 $("collection").textContent=world.title;$("releaseStatus").textContent=world.publication;
 $("revision").textContent="Revision "+world.revision;
 issues.replaceChildren();
 if(!result.issues.length)issues.append(html("p","issue clear","Local source and rights reviews complete. Export still requires publisher approval."));
 else for(const reason of result.issues)issues.append(html("div","issue",reason));
 $("prepare").disabled=world.actor!==world.publisher||result.issues.length>0||world.publication==="exported";
 $("prepare").textContent=world.publication==="exported"?"Prepared locally ✓":"Prepare reviewed exhibit";
 const journal=$("journal");journal.replaceChildren();
 for(const event of [...world.journal].reverse().slice(0,25)){
  const div=html("div","journal-entry");
  div.append(html("strong",null,event.action.replaceAll("-"," ")+" · "+event.actor),
   html("small",null,event.item+" · revision "+event.revision+" · "+event.at));
  if(event.note)div.append(html("p",null,event.note));
  journal.append(div);
 }
 if(!world.journal.length)journal.append(html("p",null,"No curatorial reviews recorded yet."));
}
function render(){
 validate(world);$("actor").value=world.actor;
 objects();editor();visitor();reviews();
}
$("actor").addEventListener("change",e=>{world.actor=e.target.value;render();notice("Simulated curatorial role changed. This is not institutional authentication.");});
$("rightsAttestation").addEventListener("change",()=>editor());
$("language").addEventListener("change",e=>{lang=e.target.value;visitor();});
$("moveUp").addEventListener("click",()=>safe(()=>mutate("reorder",{id:selected,direction:-1})));
$("moveDown").addEventListener("click",()=>safe(()=>mutate("reorder",{id:selected,direction:1})));
$("saveInterpretation").addEventListener("click",()=>safe(()=>{
 mutate("caption",{id:selected,body:$("objectBody").value,caption:$("objectCaption").value,es:$("objectSpanish").value});
 notice("Interpretation changed. Source and rights checks must be reviewed again where applicable.");
}));
$("sourceReview").addEventListener("click",()=>safe(()=>{
 mutate("source-review",{id:selected});notice("Local curator review recorded. Original source remains linked. Embedded media still needs independent rights review.");
}));
$("rightsClear").addEventListener("click",()=>safe(()=>{
 if(!$("rightsAttestation").checked)throw Error("Confirm your source and rights examination before recording a review.");
 mutate("rights",{id:selected,rights:"cleared",note:"Separate local reviewer attested inspection of displayed credit and license; no third-party grant asserted"});
 $("rightsAttestation").checked=false;render();
 notice("Local rights review recorded; this is not a third-party clearance.");
}));
$("rightsRefuse").addEventListener("click",()=>safe(()=>{
 mutate("rights",{id:selected,rights:"needs-review",note:"Rights require independent investigation"});
 notice("Media rights issue flagged.",true);
}));
$("addObject").addEventListener("submit",e=>{e.preventDefault();safe(()=>{
 const data=Object.fromEntries(new FormData(e.target));
 data.year=Number(data.year);
 mutate("add",data);selected=data.id;render();
 e.target.reset();e.target.closest("details").open=false;notice("New archival source added as unreviewed.");
});});
$("save").addEventListener("click",()=>safe(save));
$("reset").addEventListener("click",()=>safe(async()=>{
 if(!confirm("Replace this local curatorial draft with the original public-source exhibition example?"))return;
 world=sourceExample();selected=world.order[0];dirty=false;
 if(db)revision=await store(revision,world);
 render();notice("Public-source exhibition reset.");
}));
$("export").addEventListener("click",()=>safe(()=>{
 const report=readiness(world);
 download("aurekai-exhibit-preview.html",visitorDocument(world));
 notice(report.issues.length?"Exported DRAFT visitor HTML. Rights/curatorial review remains incomplete.":"Visitor HTML exported for local preview; not published.");
}));
$("handoff").addEventListener("click",()=>safe(()=>{
 download("aurekai-exhibit-review.yaff",curatorHandoff(world),"text/plain");
 notice("Typed curatorial review downloaded; no public CMS action performed.");
}));
$("prepare").addEventListener("click",()=>safe(()=>{
 mutate("export");notice("Curator/rights source checks are prepared for authorized institutional publication—not publicly deployed.");
}));
Object.defineProperty(window,"aurekaiExhibitWitness",{get:()=>({
 revision:world.revision,actor:world.actor,items:world.items.length,
 order:world.order.slice(),review:readiness(world),publication:world.publication,
 object:selected,audit:world.journal.length
})});
(async()=>{try{
 db=await getDB();const result=await read();
 if(result){world=result.world;revision=result.saveRevision;selected=world.order[0];}
 render();
}catch(e){world=sourceExample();selected=world.order[0];render();notice("Local browser storage unavailable; review and export still work.",true);}})();
