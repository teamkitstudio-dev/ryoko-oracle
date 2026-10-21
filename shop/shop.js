'use strict';
// 販売用URLは実際に作成したBOOTH商品だけを設定する。準備中は購入不可。
function validCheckout(value){
 if(typeof value!=='string'||!value)return null;
 try{const url=new URL(value);if(url.protocol!=='https:'||url.hostname!=='aimodelgallery.booth.pm'||url.username||url.password||url.port||!/^\/items\/[1-9]\d*\/?$/.test(url.pathname))return null;url.search='';url.hash='';return url.href;}catch{return null;}
}
async function updateSale(){
 try{
  const response=await fetch('config.json',{cache:'no-store'});if(!response.ok)return;const config=await response.json();
  if(config.saleEnabled!==true||config.priceJPY!==980||config.pageCount!==20||config.samplePageCount!==4)return;
  const url=validCheckout(config.checkoutUrl);if(!url)return;
  const button=document.getElementById('buy-button');button.href=url;button.hidden=false;document.getElementById('preparing-button').hidden=true;
  document.getElementById('sale-status').textContent='本編はBOOTHで販売中です。無料サンプルで内容を確かめてからお選びいただけます。';
  document.getElementById('price-label').firstChild.textContent='販売価格 ';document.getElementById('offer-price').firstChild.textContent='販売価格 ';
  document.getElementById('delivery-note').textContent='購入・決済・ダウンロードは、移動先のBOOTH商品ページで行います。販売条件をご確認ください。';
  const answer=[...document.querySelectorAll('.faq details')].find(detail=>detail.querySelector('summary').textContent==='どうやって受け取りますか？');if(answer)answer.querySelector('p').textContent='BOOTHのダウンロード商品として販売します。購入・決済・受け取りの方法と条件は、BOOTHの商品ページでご確認ください。';
 }catch{/* 設定を読めない場合も、無料サンプルと準備中表示を維持する。 */}
}
updateSale();
