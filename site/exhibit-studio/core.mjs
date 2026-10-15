/* Bonfyre Collection/Exhibit Studio: source identity, curator state,
 * exact rights review, visitor projection and bounded local publication draft.
 * Does not issue a CMS publication, represent a rights licence or admit proof.
 */
export const MEDIA=["image","audio","document","external"];
export const LICENSE=["public-domain-us","cc0","cc-by-4","permission-required","unknown"];
export const STATES=["source_supplied","curator_reviewed","rights_reviewed"];
export const safeUrl=s=>{
 try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password&&!u.hash&&u.href.length<=800;}catch{return false;}
};
export function sourceExample(){
 return {
  id:"teasdale-sourced-poetry",truth:"curated_public_source_example",
  title:"A Voice in the Archive",subtitle:"Sara Teasdale, published poetry and a public-domain reading",
  introduction:"Explore an early twentieth-century poet through a period portrait, original biographical and award records, and a sourced LibriVox reading. Original material, rights and contemporary editorial choices are distinguished.",
  venue:"Aurekai Exhibition Studio / public-source example",
  curator:"marin",rightsReviewer:"ellen",publisher:"taylor",actor:"marin",
  language:"en",revision:0,publication:"draft",publicNote:"Exhibit in progress. Not officially published by a museum.",
  order:["teasdale-photo","love-songs","teasdale-award","librivox-reading"],
  items:[
   {id:"teasdale-photo",year:1907,type:"image",
    title:"A period portrait of Sara Teasdale",
    subtitle:"Portrait held in the Missouri History Museum collection",
    body:"A 1907 portrait helps a visitor encounter the writer in the period when she began publishing. The date and archive credit remain attached to the image, not inferred from appearance.",
    source:"https://commons.wikimedia.org/wiki/File:Sara_Teasdale._Photograph_by_unknown%2C_1907_Missouri_History_Museum_Photograph_and_Print_Collection._Portraits_n38637.jpg",
    media:"https://upload.wikimedia.org/wikipedia/commons/1/13/Sara_Teasdale._Photograph_by_unknown%2C_1907_Missouri_History_Museum_Photograph_and_Print_Collection._Portraits_n38637.jpg",
    credit:"Unknown photographer; Missouri History Museum Photograph and Print Collection; Wikimedia Commons",
    license:"public-domain-us",rights:"pending",state:"source_supplied",reviewNote:"",rightsNote:"",
    tag:"Historic photograph",language:{es:""},caption:"Image via Wikimedia Commons. U.S. public-domain status must be confirmed for proposed use."},
   {id:"love-songs",year:1917,type:"document",
    title:"Love Songs / a published collection",
    subtitle:"A source-linked milestone in American lyrical poetry",
    body:"Teasdale's Love Songs appeared in 1917. Interpretive text belongs to the curator; the source itself remains available for verification.",
    source:"https://www.poetryfoundation.org/poets/sara-teasdale",
    media:"",credit:"Poetry Foundation biography, Sara Teasdale",
    license:"unknown",rights:"not-applicable",state:"source_supplied",reviewNote:"",rightsNote:"",
    tag:"Publication history",language:{es:""},caption:"Source-linked interpretive note; not a facsimile reproduction."},
   {id:"teasdale-award",year:1918,type:"external",
    title:"An award for Love Songs",
    subtitle:"Published awards history",
    body:"The Pulitzer Prize site's archival listing identifies Love Songs by Sara Teasdale in its 1918 poetry record. Related institutions distinguish this award's historical designation; the primary awards page is linked.",
    source:"https://www.pulitzer.org/winners/sara-teasdale",media:"",
    credit:"The Pulitzer Prizes / historical winners record",
    license:"unknown",rights:"not-applicable",state:"source_supplied",reviewNote:"",rightsNote:"",
    tag:"Historical record",language:{es:""},caption:"Official awards listing; no audio or image is reused."},
   {id:"librivox-reading",year:2026,type:"audio",
    title:"After Love / a sourced spoken reading",
    subtitle:"Public-domain LibriVox recording, edited excerpt",
    body:"Listen to a short excerpt from a LibriVox volunteer reading. This is a contemporary exhibition arrangement of an existing recording; the date shown refers to the exhibit cut, not the original performance.",
    source:"https://archive.org/details/spc266_2508_librivox",
    media:"https://nickgonzales76017.github.io/pages-podcast-plant/studio/media/voice-reading.mp3",
    credit:"LibriVox Short Poetry Collection 266; After Love by Sara Teasdale; volunteer reader",
    license:"public-domain-us",rights:"pending",state:"source_supplied",reviewNote:"",rightsNote:"",
    tag:"Listening archive",language:{es:""},caption:"11.5-second voice excerpt; original collection and licensing information linked."}
  ],journal:[]
 };
}
export const TYPES=MEDIA;
const idOk=s=>typeof s==="string"&&/^[a-z][a-z0-9-]{2,70}$/.test(s);
export function validate(e){
 if(!e||!idOk(e.id)||e.truth!=="curated_public_source_example"&&e.truth!=="user-curated"||
   !Array.isArray(e.items)||e.items.length<1||e.items.length>75||
   !Array.isArray(e.order)||e.order.length!==e.items.length||
   e.curator===e.rightsReviewer||e.publisher===e.curator||
   !Number.isSafeInteger(e.revision)||e.revision<0)throw Error("Exhibit's identity, actor or collection limits invalid.");
 const ids=new Set();for(const item of e.items){
  if(!idOk(item.id)||ids.has(item.id)||!MEDIA.includes(item.type)||
   !LICENSE.includes(item.license)||!STATES.includes(item.state)||
   typeof item.title!=="string"||!item.title.trim()||item.title.length>160||
   !Number.isSafeInteger(item.year)||item.year<1500||item.year>2200||
   !safeUrl(item.source)||item.media&&!safeUrl(item.media)||
   !["pending","cleared","needs-review","not-applicable"].includes(item.rights)||
   typeof item.credit!=="string"||item.credit.length>500||
   typeof item.body!=="string"||item.body.length>2600)
   throw Error("Media rights, chronology, original source or identity missing.");
  ids.add(item.id);
 }
 if(new Set(e.order).size!==e.order.length||e.order.some(id=>!ids.has(id)))throw Error("Exhibit ordering does not match exact source objects.");
 return e;
}
export function readiness(e){
 validate(e);
 const issues=[];
 for(const item of e.items){
  if(item.state!=="rights_reviewed"&&item.state!=="curator_reviewed")
   issues.push(item.id+": source interpretation not locally reviewed");
  if(item.type==="image"||item.type==="audio"){
   if(item.rights!=="cleared")issues.push(item.id+": proposed media usage not locally rights-reviewed");
  }
  if(item.license==="cc-by-4"&&!item.credit.trim())issues.push(item.id+": required author attribution missing");
 }
 if(!e.title.trim()||!e.introduction.trim())issues.push("visitor introduction missing");
 return {count:e.items.length,media:e.items.filter(i=>i.media).length,
  sourceReviewed:e.items.filter(i=>i.state!=="source_supplied").length,
  rightsCleared:e.items.filter(i=>i.rights==="cleared"||i.rights==="not-applicable").length,
  issues,state:issues.length?"needs_curatorial_review":"eligible_for_local_exhibit_export"};
}
const event=(e,actor,action,item,note="")=>{
 e.revision++;e.journal.push({revision:e.revision,actor,action,item,at:new Date().toISOString(),note:String(note).slice(0,260)});
 if(e.journal.length>400)e.journal.shift();return e;
};
export function transition(source,actor,action,data={}){
 const e=structuredClone(validate(source)),item=e.items.find(i=>i.id===data.id);
 if(![e.curator,e.rightsReviewer,e.publisher].includes(actor))throw Error("Unrecognized curatorial actor.");
 if(e.publication==="exported")e.publication="draft";
 if(action==="caption"){
  if(actor!==e.curator||!item)throw Error("Only the curator can annotate an existing source.");
  if(data.body!==undefined)item.body=String(data.body).slice(0,2600);
  if(data.caption!==undefined)item.caption=String(data.caption).slice(0,600);
  if(data.title!==undefined)item.title=String(data.title).slice(0,160);
  if(data.es!==undefined)item.language.es=String(data.es).slice(0,500);
  item.state="source_supplied";return event(e,actor,action,item.id);
 }
 if(action==="source-review"){
  if(actor!==e.curator||!item||!safeUrl(item.source))throw Error("Curator source and original URL required.");
  item.state="curator_reviewed";item.reviewNote=String(data.note||"Source and claim reviewed for this local draft").slice(0,350);
  return event(e,actor,action,item.id);
 }
 if(action==="rights"){
  if(actor!==e.rightsReviewer||!item)throw Error("Separate rights-review actor required.");
  if(item.type!=="image"&&item.type!=="audio")throw Error("Linked-only document has no embedded media right to license.");
  if(!["cleared","needs-review"].includes(data.rights)||item.state==="source_supplied")
   throw Error("First review source identity and provide rights decision.");
  if(data.rights==="cleared"&&!item.credit.trim())throw Error("Media attribution/credit cannot be empty.");
  item.rights=data.rights;item.rightsNote=String(data.note||"Local rights assessment only").slice(0,320);
  if(data.rights==="cleared")item.state="rights_reviewed";
  return event(e,actor,action,item.id);
 }
 if(action==="reorder"){
  if(actor!==e.curator||!item||![-1,1].includes(data.direction))throw Error("Curator order change refused.");
  const idx=e.order.indexOf(item.id),target=idx+data.direction;
  if(target<0||target>=e.order.length)throw Error("Item is already at the arrangement boundary.");
  [e.order[idx],e.order[target]]=[e.order[target],e.order[idx]];
  return event(e,actor,action,item.id,"Visitor order changed");
 }
 if(action==="add"){
  if(actor!==e.curator||e.items.length>=75)throw Error("Curator or collection limit prevents addition.");
  const id=String(data.id||"");
  if(!idOk(id)||e.items.some(i=>i.id===id)||!MEDIA.includes(data.type)||!safeUrl(data.source)||
   data.media&&!safeUrl(data.media)||!Number.isSafeInteger(Number(data.year)))
   throw Error("New archival source requires unique identity, type and original HTTPS reference.");
  const fresh={id,year:Number(data.year),type:data.type,title:String(data.title||"").slice(0,160),
   subtitle:"Visitor narration awaiting review",body:String(data.body||"").slice(0,2600),
   source:data.source,media:data.media||"",credit:String(data.credit||"").slice(0,500),
   license:"unknown",rights:data.type==="audio"||data.type==="image"?"pending":"not-applicable",
   state:"source_supplied",reviewNote:"",rightsNote:"",tag:"New source",language:{es:""},
   caption:"Original source provided; local rights and interpretation unreviewed"};
  e.items.push(fresh);e.order.push(id);validate(e);
  return event(e,actor,action,id,"Source registered, not independently verified");
 }
 if(action==="export"){
  if(actor!==e.publisher)throw Error("Only the publication reviewer can prepare a public exhibit.");
  const score=readiness(e);if(score.issues.length)throw Error("Source/rights frontier incomplete: "+score.issues[0]);
  e.publication="exported";return event(e,actor,action,e.id,"Exhibit exported locally; not publicly deployed.");
 }
 throw Error("Unsupported museum-state transition.");
}
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function visitorMarkup(e,{language="en"}={}){
 validate(e);const source=escape;
 const cards=e.order.map(id=>{
  const i=e.items.find(x=>x.id===id);const lang=language==="es"&&i.language.es?i.language.es:i.body;
  const media=i.type==="image"&&i.media?'<img src="'+source(i.media)+'" loading="lazy" alt="'+source(i.title)+'"/>':
   i.type==="audio"&&i.media?'<audio controls preload="none" src="'+source(i.media)+'"></audio>':"";
  return '<article class="item"><p class="year">'+i.year+' · '+source(i.tag)+'</p><h2>'+source(i.title)+'</h2>'+
   '<p>'+source(lang)+'</p>'+media+
   '<p><a href="'+source(i.source)+'" target="_blank" rel="noopener noreferrer">Original source ↗</a></p>'+
   '<small>Credit: '+source(i.credit)+' · License: '+source(i.license)+' · Rights: '+source(i.rights)+'</small></article>';
 }).join("");
 const state=readiness(e);
 const banner=state.issues.length?'<p class="notice">DRAFT CURATOR PREVIEW · Rights and interpretation require review.</p>':"";
 return '<main class="exhibition"><header><p>Source-linked archival exhibition</p><h1>'+source(e.title)+'</h1><p>'+
  source(e.introduction)+'</p></header>'+banner+cards+'<footer><p>Source identities and credits retained. Local preview does not constitute museum publication.</p></footer></main>';
}
export function visitorDocument(e){
 const markup=visitorMarkup(e);
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>'+escape(e.title)+'</title><style>body{margin:0;background:#151d18;color:#eaf0e7;font:18px/1.7 Georgia,serif}.exhibition{max-width:920px;margin:auto;padding:5vw 24px}h1{font-size:clamp(3rem,8vw,6rem);line-height:1}h2{font-size:2rem}.item{padding:35px 0;border-bottom:1px solid #45614b}img{display:block;max-width:100%;max-height:620px;object-fit:contain}audio{width:100%}.year,small,.notice,footer{font:12px/1.6 system-ui;color:#b8c9b9}a{color:#dfc78c}.notice{border:1px solid #876;padding:12px}</style></head><body>'+
 markup+'</body></html>';
}
export function curatorHandoff(e){
 const score=readiness(e);
 const atom=s=>'"'+String(s??"").replace(/[\r\n\t"]/g," ").slice(0,500)+'"';
 return ["program source-exhibit-review","exhibit "+e.id,"title "+atom(e.title),
  "revision "+e.revision,"source_count "+score.count,"rights_review_issues "+score.issues.length,
  ...e.order.map(id=>{const i=e.items.find(x=>x.id===id);
    return "item "+id+" "+i.type+" "+i.year+" "+i.state+" "+i.rights+" "+atom(i.source)+" "+atom(i.license);
  }),
  "authority local-preview-only","cannot_infer local_source_review_is_not_publication_or_license_certification"
 ].join("\n")+"\n";
}
