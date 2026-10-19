// DOM/interaction smoke tests without external dependencies.
// Run: node tests/smoke-mock.js
// This is a mock environment, NOT a real browser rendering check.
function runOracleSmoke(html){
 const script=html.split('<script>')[1]?.split('</script>')[0];
 if(!script)throw new Error('inline JavaScript not found');
 const cases=[],failures=[];
 const check=(ok,label)=>{cases.push({label,pass:!!ok});if(!ok)failures.push(label)};
 new Function(script); check(true,'JS syntax');
 class El{
  constructor(id){this.id=id;this.children=[];this.listeners={};this.dataset={};this.textContent='';this.value='';this.hidden=false;this.attributes={};this.validity={valid:true};}
  addEventListener(type,handler){this.listeners[type]=handler}
  append(...items){this.children.push(...items)}
  replaceChildren(...items){this.children=[...items]}
  setAttribute(key,value){this.attributes[key]=value}
  getAttribute(key){return this.attributes[key]}
  focus(){this.focused=true}
  reset(){}
  add(item){this.children.push(item)}
  reportValidity(){return true}
  querySelector(sel){return this.children.find(x=>x.tag===sel)||new El(sel)}
  fire(name,event={}){if(!this.listeners[name])throw Error('missing listener '+this.id+' '+name);return this.listeners[name]({preventDefault(){},...event})}
 }
 const nodes={},get=id=>nodes[id]||(nodes[id]=new El(id));
 for(const id of ['reading-details','selection','result','quick-panel','journal','portrait'])get(id).hidden=true;
 get('reading-setup').hidden=false;get('quick-entry').hidden=false;
 const cards=['A','B','C'].map(id=>{const e=new El('card-'+id);e.dataset.card=id;return e});
 const guides=['ryoko','ren'].map(id=>{const e=new El('guide-'+id);e.dataset.guide=id;return e});
 const small=new El('small');small.tag='small';get('placeholder').append(small);
 const document={
  body:{dataset:{}},
  getElementById:get,
  createElement:tag=>{const el=new El('created-'+tag);el.tag=tag;return el},
  querySelectorAll:selector=>selector==='[data-card]'?cards:selector==='button[data-guide]'?guides:[],
  querySelector:selector=>selector==='.signature'?get('signature'):null
 };
 const data=new Map(), localStorage={
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>data.set(key,value),
  removeItem:key=>data.delete(key)
 };
 const window={confirm:()=>true,scrollTo:()=>{}};
 function FormData(form){this.get=key=>
  form.id==='reading-setup'?(key==='theme'?'love':null):
  form.id==='reading-details'?(key==='situation'?'1':key==='perspective'?'2':null):null;
 }
 function Option(text,value){this.text=text;this.value=value}
 new Function('document','Option','window','localStorage','FormData',script)(document,Option,window,localStorage,FormData);
 check(!!get('quick-start').listeners.click,'quick button wired');
 get('quick-start').fire('click');
 check(get('quick-panel').hidden===false&&get('reading-setup').hidden===true,'quick-reading navigation');
 check(get('quick-title').textContent.length>2&&get('quick-action').textContent.length>5,'quick content');
 check(data.size===0,'no history without save');
 get('quick-save').fire('click');
 check(data.size===1&&JSON.parse([...data.values()][0]).length===1,'quick opt-in save');
 check(!JSON.stringify([...data.values()][0]).includes('birthday'),'date of birth not stored');
 check(get('journal').hidden===true,'history hidden while quick-reading');
 get('quick-full').fire('click');
 check(get('reading-setup').hidden===false&&get('quick-panel').hidden===true,'go to full setup');
 check(get('journal').hidden===false,'history shown on setup');
 get('reading-setup').fire('submit');
 check(get('reading-details').hidden===false&&get('quick-entry').hidden===true,'details navigation');
 check(get('situation-options').children.length===3&&get('perspective-options').children.length===3,'existing options');
 get('consult-memo').value='<img src=x onerror=alert(1)> 片思いの悩み';
 get('reading-details').fire('submit');
 check(get('selection').hidden===false,'card selection navigation');
 cards[0].fire('click');
 check(get('result').hidden===false&&get('result-title').textContent.length>0,'full reading result');
 check(get('consult-summary').textContent.includes('<img src=')&&get('consult-summary').hidden===false,'memo only textContent');
 check(get('daily-heading').textContent.length>0&&get('monthly-message').textContent.length>0,'daily and monthly');
 check(get('reading').children.length===7,'7 original reading sections');
 get('save-reading').fire('click');
 check(JSON.parse([...data.values()][0]).length===2,'full result saved');
 check(!JSON.stringify([...data.values()][0]).includes('片思いの悩み'),'memo not stored');
 check(get('journal').hidden===true,'history hidden while full reading');
 guides[1].fire('click');
 check(get('result').hidden===false&&get('result-label').textContent.includes('れん'),'guide switch keeps result');
 get('again').fire('click');
 check(get('selection').hidden===false&&get('result').hidden===true,'retry flow');
 cards[1].fire('click');
 check(get('result').hidden===false&&get('reading').children.length===7,'second card works');
 get('home').fire('click');
 check(get('reading-setup').hidden===false&&get('journal').hidden===false,'home and history');
 get('journal-delete').fire('click');
 check(data.size===0&&get('journal').hidden===true,'delete saved history');
 return {count:cases.length,passed:cases.filter(x=>x.pass).length,failed:failures,details:cases};
}
if(typeof require==='function'&&typeof module!=='undefined'&&require.main===module){
 const fs=require('fs'),path=require('path'),html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const result=runOracleSmoke(html);
 console.log(JSON.stringify(result,null,2));
 if(result.failed.length)process.exitCode=1;
}
