const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {readFile}=require('node:fs/promises');
const url=process.env.DELIVERY_URL;
const passphrase=process.env.DELIVERY_CODE;
const expected=JSON.parse(process.env.DELIVERY_HASHES||'{}');
const names=JSON.parse(process.env.DELIVERY_NAMES||'{"book":"ryoko-ren-love-oracle-v2.pdf","cover":"booth-cover.png","kit":"BOOTH-oracle-v2-upload-kit.zip"}');
if(!url||!passphrase||!expected.book||!expected.cover||!expected.kit)throw new Error('Set DELIVERY_URL, DELIVERY_CODE and DELIVERY_HASHES privately.');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const results=[];
  for(const width of [375,390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true});
   const errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>requests.push({url:r.url(),body:r.postData(),method:r.method()}));
   await page.goto(url);
   assert(await page.locator('#files').isHidden());
   assert.equal(await page.locator('#passphrase').inputValue(),'');
   if(width===375){
    await page.locator('#passphrase').fill('incorrect-test-code');
    await page.locator('#unlock').click();
    await page.waitForFunction(()=>document.getElementById('status').textContent.includes('合言葉が違う'));
    assert(await page.locator('#files').isHidden());
    assert.equal(await page.locator('#book-save').getAttribute('href'),null);
   }
   await page.locator('#passphrase').fill(passphrase);
   await page.locator('#unlock').click();
   await page.locator('#files').waitFor({state:'visible'});
   assert(await page.locator('#unlock-form').isHidden());
   assert.equal(await page.locator('#passphrase').inputValue(),'');
   for(const id of ['kit','book','cover']){
    const event=page.waitForEvent('download');
    await page.locator('#'+id+'-save').click();
    const download=await event;
    assert.equal(download.suggestedFilename(),names[id]);
    assert.equal(await download.failure(),null);
    const content=await readFile(await download.path());
    assert.equal(createHash('sha256').update(content).digest('hex'),expected[id]);
    if(id==='book')assert.equal(content.subarray(0,5).toString(),'%PDF-');
    if(id==='kit')assert.equal(content.subarray(0,2).toString(),'PK');
   }
   await page.locator('#listing-fields summary').click();
   assert.match(await page.locator('#product-title').inputValue(),/りょうこ・れんの恋愛カード占い/);
   const description=await page.locator('#product-description').inputValue();
   assert.match(description,/3段階で各5枚から1枚ずつ選び/);
   assert.match(description,/固定の15枚/);
   assert(!description.includes('<!--'));
   assert(!description.includes('書き込みワーク'));
   await page.locator('#listing-fields summary').click();
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
   await page.screenshot({path:'/tmp/ryoko-owner-'+width+'.png',fullPage:true});
   assert(requests.every(r=>!r.url.includes(passphrase)&&!r.body&&r.method==='GET'));
   assert(requests.every(r=>new URL(r.url).origin===new URL(url).origin));
   await page.reload();
   assert(await page.locator('#files').isHidden());
   assert.equal(await page.locator('#passphrase').inputValue(),'');
   assert.deepEqual(errors,[]);
   results.push({width,downloadsMatchOriginals:true,codeNotTransmitted:true,noOverflowOrJsErrors:true});
   await page.close();
  }
  const page=await browser.newPage();
  await page.route('**/book*.bin',async route=>{
   const response=await route.fetch();
   const body=Buffer.from(await response.body());body[0]^=1;
   await route.fulfill({response,body});
  });
  await page.goto(url);await page.locator('#passphrase').fill(passphrase);await page.locator('#unlock').click();
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('正しく開けません'));
  assert(await page.locator('#files').isHidden());
  assert.equal(await page.locator('#book-save').getAttribute('href'),null);
  await page.close();
  console.log(JSON.stringify({results,wrongCodeRejected:true,tamperingRejected:true,reloadClearsAccess:true},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
