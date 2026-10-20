'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({
    executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
    args:['--no-sandbox']
  });
  const results=[];
  let page;
  async function check(label,fn){await fn();results.push(label);console.log('PASS '+label);}
  try{
    page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.goto(process.env.ORACLE_URL||'http://127.0.0.1:8000/',{waitUntil:'load'});
    await check('main and extension loaded',async()=>{
      assert.equal(await page.locator('#review-quick-start').count(),1);
      assert.equal(await page.locator('#reading-details').isHidden(),true);
      assert.equal(await page.locator('.cards [data-card]').count(),5);
    });
    await page.locator('#review-quick-start').click();
    await check('quick reading keeps 15-card source',async()=>{
      assert.equal(await page.locator('#reading-setup').isHidden(),true);
      assert.equal(await page.locator('#review-quick-panel').isVisible(),true);
      assert.ok((await page.locator('#review-quick-title').textContent()).length>0);
      const src=await page.locator('#review-quick-art').getAttribute('src');
      assert.match(src,/^assets\/card-[a-z]+\.webp$/);
    });
    await page.locator('#review-quick-save').click();
    await check('opt-in history excludes private inputs',async()=>{
      const history=await page.evaluate(()=>localStorage.getItem('ryoko-review-history-v1'));
      assert.equal(JSON.parse(history).length,1);
      assert.equal(await page.locator('#review-quick-status').textContent(),'このブラウザに保存しました。');
    });
    await page.locator('#review-quick-detail').click();
    await check('quick to full journey',async()=>{
      assert.equal(await page.locator('#reading-setup').isVisible(),true);
      assert.equal(await page.locator('#review-journal').isVisible(),true);
    });
    await page.locator('#birthday').fill('1990-01-15');
    await page.locator('input[name="theme"][value="work"]').check();
    await page.locator('#reading-setup button[type="submit"]').click();
    await page.locator('#situation-options input').first().check();
    await page.locator('#perspective-options input').first().check();
    await page.locator('#review-consult-memo').fill('<img src=x onerror=alert(1)> 仕事の相談');
    await page.locator('#reading-details button[type="submit"]').click();
    await check('details to five-card deck',async()=>{
      assert.equal(await page.locator('#selection').isVisible(),true);
      assert.equal(await page.locator('.cards [data-card]').count(),5);
    });
    for(let i=0;i<3;i++){
      await page.locator('.cards button[data-card]').first().click();
      await check('three-stage result '+(i+1),async()=>{
        assert.equal(await page.locator('#result').isVisible(),true);
        assert.ok((await page.locator('#review-memo-summary').textContent()).includes('<img src=x'));
        assert.equal(await page.locator('#review-memo-summary img').count(),0);
        assert.equal(await page.locator('.review-monthly').isVisible(),true);
        assert.ok((await page.locator('#review-monthly-text').textContent()).length>8);
      });
      if(i!==2){
        await page.locator('#journey-options input').first().check();
        await page.locator('#journey-response button[type="submit"]').click();
        assert.equal(await page.locator('#selection').isVisible(),true);
      }
    }
    await page.locator('#review-save-reading').click();
    await check('history after three-card completion',async()=>{
      const raw=await page.evaluate(()=>localStorage.getItem('ryoko-review-history-v1'));
      const records=JSON.parse(raw);
      assert.equal(records.length,2);
      assert.equal(raw.includes('1990-01-15'),false);
      assert.equal(raw.includes('仕事の相談'),false);
      assert.ok(records[0].card.includes('・'));
    });
    await page.locator('#home').click();
    await check('return to original setup',async()=>{
      assert.equal(await page.locator('#reading-setup').isVisible(),true);
      assert.equal(await page.locator('#review-journal').isVisible(),true);
      assert.equal(await page.locator('#review-consult-memo').inputValue(),'');
    });
    page.on('dialog',dialog=>dialog.accept());
    await page.locator('#review-journal-delete').click();
    await check('opt-in history deletion',async()=>{
      assert.equal(await page.locator('#review-journal').isHidden(),true);
      assert.equal(await page.evaluate(()=>localStorage.getItem('ryoko-review-history-v1')),null);
    });
    assert.deepEqual(errors,[],'no uncaught JavaScript exceptions');
    console.log(JSON.stringify({passed:results.length,checks:results},null,2));
  }catch(err){
    if(page)await page.screenshot({path:'/tmp/oracle-review-error.png',fullPage:true}).catch(()=>{});
    throw err;
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
