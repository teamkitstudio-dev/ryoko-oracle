const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=(process.env.APP_URL||'http://127.0.0.1:8765/ryoko-oracle/').replace(/\/?$/,'/');
const executablePath=process.env.CHROMIUM_PATH||'/usr/bin/chromium';
const config={productTitle:'りょうこ・れんの恋愛カード占い',productVersion:'2.0',priceJPY:980,pageCount:20,samplePageCount:4,saleEnabled:false,shopUrl:'https://aimodelgallery.booth.pm/',checkoutUrl:null};
(async()=>{const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});const results=[];
for(const width of [375,390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'shop/');
 assert(await page.locator('#preparing-button').isDisabled());assert(await page.locator('#buy-button').isHidden());assert.match(await page.locator('#sale-status').innerText(),/販売準備中/);
 await page.locator('.cover-wrap img').evaluate(i=>i.decode());assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));await page.screenshot({path:`/tmp/ryoko-shop-${width}.png`,fullPage:true});
 for(const detail of await page.locator('.faq details').all()){await detail.locator('summary').click();assert(await detail.evaluate(el=>el.open));}
 const pdf=await page.request.get(base+'shop/sample.pdf');assert.equal(pdf.status(),200);assert.match(pdf.headers()['content-type'],/pdf/);assert((await pdf.body()).subarray(0,4).equals(Buffer.from('%PDF')));
 await page.locator('a[href="sample.html?v=2"]').first().click();assert.match(page.url(),/sample.html\?v=2$/);assert.equal(await page.locator('.page').count(),4);assert.match(await page.locator('.page').nth(1).innerText(),/今の恋の運気/);assert.equal(await page.locator('.pick').count(),5);for(let i=0;i<5;i++){await page.locator('.pick').nth(i).click();assert.equal(new URL(page.url()).hash,'#sample-'+i);assert(await page.locator('#sample-'+i).isVisible());await page.locator('a[href="#sample-choice"]').click();}assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));await page.screenshot({path:`/tmp/ryoko-sample-${width}.png`,fullPage:true});await page.getByRole('link',{name:'商品案内に戻る'}).click();assert.match(page.url(),/shop\/$/);
 // 有効なURLを設定した場合の表示だけを検証。外部ショップへの移動・購入はしない。
 await page.route('**/shop/config.json',route=>route.fulfill({json:{...config,saleEnabled:true,checkoutUrl:'https://aimodelgallery.booth.pm/items/12345678'}}));await page.reload();await page.locator('#buy-button').waitFor({state:'visible'});assert.equal(await page.locator('#buy-button').getAttribute('href'),'https://aimodelgallery.booth.pm/items/12345678');assert(await page.locator('#preparing-button').isHidden());assert.match(await page.locator('#sale-status').innerText(),/販売中/);
 await page.unroute('**/shop/config.json');await page.route('**/shop/config.json',route=>route.fulfill({json:{...config,saleEnabled:true,checkoutUrl:'javascript:alert(1)'}}));await page.reload();assert(await page.locator('#buy-button').isHidden());assert(await page.locator('#preparing-button').isDisabled());
 await page.unroute('**/shop/config.json');await page.route('**/shop/config.json',route=>route.fulfill({json:{...config,productVersion:'1.0',saleEnabled:true,checkoutUrl:'https://aimodelgallery.booth.pm/items/9022964'}}));await page.reload();assert(await page.locator('#buy-button').isHidden());
 await page.unroute('**/shop/config.json');await page.route('**/shop/config.json',route=>route.abort());await page.reload();assert(await page.locator('#buy-button').isHidden());assert(await page.locator('#preparing-button').isDisabled());await page.unroute('**/shop/config.json');
 await page.goto(base+'index.html');await page.locator('#birthday').fill('1990-05-10');await page.locator('#show-daily').click();assert(await page.locator('#daily-result').isVisible());
 for(const theme of ['love','work']){
  await page.locator('input[name=theme][value="'+theme+'"]').check();await page.locator('#reading-setup [type=submit]').click();await page.locator('input[name=situation][value="1"]').check();await page.locator('input[name=perspective][value="1"]').check();await page.locator('#reading-details [type=submit]').click();
  for(let stage=0;stage<3;stage++){await page.locator('#selection [data-card]').first().click();if(stage<2){assert(await page.locator('#product-teaser').isHidden());await page.locator('input[name=journey-answer][value="0"]').check();await page.locator('#continue-reading').click();}}
  assert(await page.locator('#final-actions').isVisible());assert.equal(await page.locator('#product-teaser').isVisible(),theme==='love');assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
  if(theme==='love'){const popupPromise=page.waitForEvent('popup');await page.locator('#product-teaser a').click();const popup=await popupPromise;await popup.waitForLoadState();assert.equal(popup.url(),base+'shop/');assert(!popup.url().includes('1990'));assert(await popup.locator('#buy-button').isHidden());await popup.close();}
  await page.locator('#home').click();
 }
 assert.deepEqual(errors,[]);results.push({width,passed:true,checks:'preparing state, real sample PDF and 4-page HTML, cover, FAQ, no overflow, mocked valid checkout transition, invalid/missing config safe, love-only final CTA, work unchanged, three-card and birthday regression, no JS exceptions'});await page.close();
}
console.log(JSON.stringify(results,null,2));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
