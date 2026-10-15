import test from "node:test";
import assert from "node:assert/strict";
import {sourceExample,readiness,validate,transition,visitorMarkup,visitorDocument,curatorHandoff,safeUrl} from "../site/exhibit-studio/core.mjs";
test("archival sample uses real source identities and licence uncertainty rather than fabricated media rights",()=>{
 const w=sourceExample();assert.equal(validate(w),w);
 assert.equal(w.items.length,4);assert.equal(w.order.length,4);
 assert.equal(w.items.filter(i=>i.media).length,2);
 assert.ok(w.items.every(i=>safeUrl(i.source)));
 assert.ok(w.items.some(i=>i.source.includes("commons.wikimedia.org")));
 assert.ok(w.items.some(i=>i.source.includes("pulitzer.org")));
 assert.ok(w.items.some(i=>i.source.includes("archive.org")));
 assert.equal(readiness(w).state,"needs_curatorial_review");
});
test("images and audio need source review followed by a different rights reviewer",()=>{
 const src=sourceExample(),id="librivox-reading";
 assert.throws(()=>transition(src,"ellen","rights",{id,rights:"cleared"}),/First review source/);
 assert.throws(()=>transition(src,"marin","rights",{id,rights:"cleared"}),/Separate rights-review/);
 const reviewed=transition(src,"marin","source-review",{id});
 assert.equal(reviewed.items.find(i=>i.id===id).state,"curator_reviewed");
 const cleared=transition(reviewed,"ellen","rights",{id,rights:"cleared"});
 assert.equal(cleared.items.find(i=>i.id===id).state,"rights_reviewed");
 assert.equal(cleared.items.find(i=>i.id===id).rights,"cleared");
 assert.equal(src.items.find(i=>i.id===id).rights,"pending");
});
test("curatorial interpretation edit reopens source review and preserves original source",()=>{
 let w=sourceExample();w=transition(w,"marin","source-review",{id:"teasdale-photo"});
 const original=w.items[0].source;
 w=transition(w,"marin","caption",{id:"teasdale-photo",body:"Curatorial note awaiting another source review",es:"Retrato de Sara Teasdale"});
 const item=w.items.find(i=>i.id==="teasdale-photo");
 assert.equal(item.state,"source_supplied");
 assert.equal(item.source,original);
 assert.equal(item.language.es,"Retrato de Sara Teasdale");
});
test("publisher cannot export until all sources and media rights are reviewed",()=>{
 let w=sourceExample();
 assert.throws(()=>transition(w,"taylor","export"),/frontier incomplete/);
 assert.throws(()=>transition(w,"marin","export"),/publication reviewer/);
 for(const item of w.items){
  w=transition(w,"marin","source-review",{id:item.id});
  if(["audio","image"].includes(item.type))w=transition(w,"ellen","rights",{id:item.id,rights:"cleared"});
 }
 assert.equal(readiness(w).issues.length,0);
 assert.equal(readiness(w).state,"eligible_for_local_exhibit_export");
 const signed=transition(w,"taylor","export");
 assert.equal(signed.publication,"exported");
 assert.equal(signed.journal.at(-1).actor,"taylor");
 assert.match(visitorDocument(signed),/Local preview does not constitute museum publication/);
 assert.match(curatorHandoff(signed),/authority local-preview-only/);
});
test("visitor projection escapes markup and keeps source URLs and item order",()=>{
 let w=sourceExample();w=transition(w,"marin","caption",{id:"love-songs",body:"Do not run <img src=x onerror=alert(1)> in a visitor preview"});
 const markup=visitorMarkup(w);
 assert.ok(markup.includes("&lt;img"));
 assert.ok(!markup.includes("<img src=x onerror"));
 assert.ok(markup.includes("Original source"));
 w=transition(w,"marin","reorder",{id:"love-songs",direction:-1});
 assert.equal(w.order[0],"love-songs");
 assert.throws(()=>transition(w,"marin","reorder",{id:"love-songs",direction:-1}),/arrangement boundary/);
});
test("archival import refuses unsafe URLs, identity collisions and malformed media",()=>{
 const w=sourceExample();
 const item={id:"new-source",year:1924,type:"document",title:"A reviewed external reference",source:"https://example.org/record",body:"Separate interpretation"};
 const expanded=transition(w,"marin","add",item);
 assert.equal(expanded.items.length,5);assert.equal(expanded.items.at(-1).state,"source_supplied");
 assert.throws(()=>transition(expanded,"marin","add",item),/unique identity/);
 assert.throws(()=>transition(w,"marin","add",{...item,id:"evil-new",source:"javascript:alert(1)"}),/original HTTPS/);
 assert.throws(()=>transition(w,"taylor","add",item),/Curator/);
});
test("readonly local-preview media never upgrades source link to a public institution's permission",()=>{
 let w=sourceExample();const preview=visitorMarkup(w);
 assert.match(preview,/DRAFT CURATOR PREVIEW/);
 assert.match(preview,/LibriVox/);
 assert.match(preview,/Rights: pending/);
 assert.match(curatorHandoff(w),/rights_review_issues [1-9]/);
});
