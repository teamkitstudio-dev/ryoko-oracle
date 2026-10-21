'use strict';
const form=document.getElementById('unlock-form');
const input=document.getElementById('passphrase');
const button=document.getElementById('unlock');
const status=document.getElementById('status');
const files=document.getElementById('files');
const objectUrls=[];
function clearFiles(){
 files.hidden=true;
 for(const url of objectUrls.splice(0))URL.revokeObjectURL(url);
 for(const id of ['book-save','cover-save'])document.getElementById(id).removeAttribute('href');
}
const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
form.addEventListener('submit',async event=>{
 event.preventDefault();clearFiles();
 const passphrase=input.value.trim();
 if(!passphrase)return;
 if(!globalThis.crypto?.subtle){status.textContent='このページをSafariやChromeのHTTPS画面で開いてください。';return;}
 button.disabled=true;status.textContent='ファイルを準備しています。少しお待ちください。';
 try{
  const response=await fetch('manifest.json',{cache:'no-store'});
  if(!response.ok)throw new Error('network');
  const manifest=await response.json();
  if(manifest.version!==1||manifest.iterations!==310000||manifest.files.length!==2)throw new Error('format');
  const encoder=new TextEncoder();
  const material=await crypto.subtle.importKey('raw',encoder.encode(passphrase),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(manifest.salt),iterations:manifest.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
  const prepared=await Promise.all(manifest.files.map(async file=>{
   if(!['book','cover'].includes(file.id)||!/^\w+\.bin$/.test(file.ciphertext))throw new Error('format');
   const encrypted=await fetch(file.ciphertext);
   if(!encrypted.ok)throw new Error('network');
   const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(file.iv),additionalData:encoder.encode(file.name)},key,await encrypted.arrayBuffer());
   return {file,blob:new Blob([plaintext],{type:file.mime})};
  }));
  for(const {file,blob} of prepared){
   const url=URL.createObjectURL(blob);objectUrls.push(url);
   const link=document.getElementById(file.id+'-save');link.href=url;link.download=file.name;
  }
  files.hidden=false;form.hidden=true;input.value='';status.textContent='準備できました。';
 }catch(error){
  clearFiles();status.textContent=error.name==='OperationError'?'合言葉が違うか、ファイルを正しく開けませんでした。合言葉をコピーし直してお試しください。':'ファイルを取得できませんでした。通信を確認して、もう一度お試しください。';
 }finally{button.disabled=false;}
});
