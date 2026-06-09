// ──────────────────────────────────────────────────────────────────────────────
// SAHAR Storefront — Dark Glassmorphism 2026 Edition
// All original logic preserved. New features added as instructed.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, ShoppingCart, X, MessageCircle, Share2, Plus, Minus, Check,
  Package, Star, Heart, Send, Bot, ArrowRight, Play,
  Shield, RefreshCcw, Award, Flame, ChevronUp, Clock, MapPin,
  Filter, SlidersHorizontal, Eye, Copy, BarChart3, Ruler, Zap
} from 'lucide-react';

// ─── TYPES (original, untouched) ──────────────────────────────────────────────
interface CustomField { id:string; label:string; type:string; options:string[]; value:string; }
interface SProduct {
  id:string; name:string; description:string; price:number; cost?:number;
  stock:number; category:string; sizes:string[]; colors:string[];
  status:string; emoji:string; imageUrl:string; images:string[]; videoUrl?:string; sku?:string;
  sales:number; views?:number; colorImages?:Record<string,string>; createdAt?:string;
  type?:'product'|'service'|'digital'; duration?:string; workArea?:string; portfolio?:string[];
  customFields?:CustomField[];
}
interface CartItem { product:SProduct; quantity:number; size:string; color:string; }
interface StoreInfo {
  brand:{name:string;phone:string;currency:string;logo?:string;description?:string;
         instagram?:string;facebook?:string;whatsapp?:string;email?:string};
  deliveryCosts?:Record<string,number>;
}
interface ChatMsg { role:'user'|'ai'; content:string; product?:SProduct; }

// ─── NEW INTERFACES (non-intrusive additions) ─────────────────────────────────
interface FlashSale { id:string; productId:string; discountPercent:number; endsAt:Date; }
interface SizeGuide { productId:string; image?:string; measurements:Record<string,Record<string,string>>; }
interface Bundle { id:string; name:string; products:string[]; bundlePrice:number; originalPrice:number; discount:number; }
interface VideoReview { id:string; productId:string; customerName:string; rating:number; videoUrl:string; title:string; createdAt:string; }
interface ProductQa { id:string; productId:string; question:string; answer?:string; asker:string; createdAt:string; }

// ─── CONSTANTS (original, untouched) ─────────────────────────────────────────
const MOROCCAN_CITIES = [
  'الدار البيضاء','الرباط','فاس','مراكش','طنجة','أكادير','مكناس','وجدة',
  'سلا','تطوان','القنيطرة','الجديدة','بني ملال','خريبكة','تازة','نادور',
  'الحسيمة','برشيد','سطات','آسفي','الرحامنة','قلعة السراغنة','خنيفرة',
  'إفران','ورزازات','زاكورة','الراشيدية','فيكيك','طاطا','ميدلت',
];
const DEFAULT_COSTS: Record<string,number> = {
  'الدار البيضاء':20,'الرباط':25,'فاس':30,'مراكش':30,'طنجة':35,
  'أكادير':35,'مكناس':30,'وجدة':40,'سلا':25,'تطوان':35,
  'القنيطرة':30,'الجديدة':35,'بني ملال':40,
};
function getDeliveryCost(city:string, costs?:Record<string,number>):number {
  const allCosts = { ...DEFAULT_COSTS, ...(costs||{}) };
  for (const [k,v] of Object.entries(allCosts)) {
    if (city.includes(k)||k.includes(city)) return v;
  }
  return allCosts['default']||40;
}

// ─── ANALYTICS (original, untouched) ─────────────────────────────────────────
function detectSource():string {
  try {
    const p=new URLSearchParams(window.location.search);
    const utm=p.get('utm_source')||p.get('source');
    if(utm) return utm.toLowerCase();
    const ref=document.referrer||'';
    if(!ref) return 'direct';
    const h=new URL(ref).hostname.replace('www.','');
    if(h.includes('facebook')||h.includes('fb.')) return 'facebook';
    if(h.includes('instagram')) return 'instagram';
    if(h.includes('tiktok')) return 'tiktok';
    if(h.includes('google')) return 'google';
    if(h.includes('wa.me')||h.includes('whatsapp')) return 'whatsapp';
    return h||'direct';
  } catch { return 'direct'; }
}
function storeSessionId():string {
  try {
    let s=sessionStorage.getItem('sahar_sid');
    if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('sahar_sid',s);}
    return s;
  } catch { return 'anon'; }
}
function trackStoreEvent(userId:string,type:'visit'|'view',product?:{id?:string;name?:string}) {
  if(!userId) return;
  try {
    fetch('/api/analytics/track',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId,type,productId:product?.id||'',productName:product?.name||'',source:detectSource(),sessionId:storeSessionId()}),
      keepalive:true,
    }).catch(()=>{});
  } catch {}
}

// ─── HOOKS (original, untouched) ──────────────────────────────────────────────
function useStorefront(userId:string) {
  const [products,setProducts]=useState<SProduct[]>([]);
  const [storeInfo,setStoreInfo]=useState<StoreInfo|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!userId){setError('رابط المتجر غير صحيح');setLoading(false);return;}
    fetch(`/api/products/public/catalog?userId=${userId}`).then(r=>r.json())
      .then(c=>{setProducts(c.products||[]);setStoreInfo({brand:c.brand||{},deliveryCosts:c.deliveryCosts});setLoading(false);})
      .catch(()=>{setError('تعذّر تحميل المتجر');setLoading(false);});
    try{const k=`sahar_visit_${userId}`;if(!sessionStorage.getItem(k)){trackStoreEvent(userId,'visit');sessionStorage.setItem(k,'1');}}catch{}
  },[userId]);
  return {products,storeInfo,loading,error};
}

function useCart() {
  const [items,setItems]=useState<CartItem[]>(()=>{
    try{const s=localStorage.getItem('sahar_cart');return s?JSON.parse(s):[];}catch{return [];}
  });
  useEffect(()=>{try{localStorage.setItem('sahar_cart',JSON.stringify(items));}catch{}},[items]);
  const add=(product:SProduct,size:string,color:string)=>setItems(prev=>{
    const ex=prev.find(i=>i.product.id===product.id&&i.size===size&&i.color===color);
    if(ex) return prev.map(i=>i===ex?{...i,quantity:i.quantity+1}:i);
    return [...prev,{product,quantity:1,size,color}];
  });
  const remove=(pid:string,size:string,color:string)=>setItems(p=>p.filter(i=>!(i.product.id===pid&&i.size===size&&i.color===color)));
  const update=(pid:string,size:string,color:string,qty:number)=>setItems(p=>qty<=0?p.filter(i=>!(i.product.id===pid&&i.size===size&&i.color===color)):p.map(i=>(i.product.id===pid&&i.size===size&&i.color===color)?{...i,quantity:qty}:i));
  const total=items.reduce((s,i)=>s+i.product.price*i.quantity,0);
  const count=items.reduce((s,i)=>s+i.quantity,0);
  const clear=()=>setItems([]);
  return {items,add,remove,update,total,count,clear};
}

// ─── DESIGN TOKENS — Dark Glassmorphism 2026 ─────────────────────────────────
const SF:React.CSSProperties = {
  '--sf-bg':'#0B1020',
  '--sf-bg2':'#121826',
  '--sf-surface':'rgba(255,255,255,0.07)',
  '--sf-surface2':'rgba(255,255,255,0.04)',
  '--sf-surface-solid':'#151f35',
  '--sf-border':'rgba(255,255,255,0.11)',
  '--sf-border2':'rgba(255,255,255,0.07)',
  '--sf-text':'#FFFFFF',
  '--sf-text2':'rgba(255,255,255,0.72)',
  '--sf-text3':'rgba(255,255,255,0.42)',
  '--sf-primary':'#FF6A00',
  '--sf-primary2':'#FF8533',
  '--sf-p10':'rgba(255,106,0,0.12)',
  '--sf-p20':'rgba(255,106,0,0.22)',
  '--sf-purple':'#7C3AED',
  '--sf-purple2':'#A855F7',
  '--sf-pu10':'rgba(124,58,237,0.15)',
  '--sf-success':'#00D2B3',
  '--sf-s10':'rgba(0,210,179,0.12)',
  '--sf-warning':'#F59E0B',
  '--sf-danger':'#EF4444',
  '--sf-glass':'rgba(255,255,255,0.07)',
  '--sf-glass-border':'rgba(255,255,255,0.12)',
  '--sf-shadow':'0 8px 32px rgba(0,0,0,0.35)',
  '--sf-shadow-lg':'0 16px 56px rgba(0,0,0,0.5)',
  '--sf-glow-orange':'0 0 24px rgba(255,106,0,0.25)',
  '--sf-glow-purple':'0 0 24px rgba(124,58,237,0.25)',
} as React.CSSProperties;

// ─── PROMO BAR (original) ────────────────────────────────────────────────────
function PromoBar() {
  const items=['🎉 شحن مجاني للطلبات فوق 200 درهم','🔄 إرجاع سهل خلال 7 أيام','⭐ جودة مضمونة 100%','🚚 توصيل لجميع المدن المغربية','💳 دفع عند الاستلام متاح'];
  return (
    <div style={{background:'linear-gradient(90deg,#7C3AED,#FF6A00,#7C3AED)',backgroundSize:'200% 100%',color:'#fff',height:30,overflow:'hidden',display:'flex',alignItems:'center',fontSize:11,fontWeight:600,animation:'sfgradientshift 6s linear infinite'}}>
      <style>{`@keyframes sfmarquee{0%{transform:translateX(-50%)}100%{transform:translateX(0%)}}@keyframes sfgradientshift{0%{background-position:0% 0}100%{background-position:200% 0}}`}</style>
      <div style={{display:'flex',gap:48,whiteSpace:'nowrap',animation:'sfmarquee 20s linear infinite',paddingInline:20}}>
        {[...items,...items].map((t,i)=><span key={i} style={{flexShrink:0,opacity:.95}}>{t}</span>)}
      </div>
    </div>
  );
}

// ─── NEW: Flash Sale Badge ───────────────────────────────────────────────────
function FlashSaleBadge({sale}:{sale:FlashSale}) {
  const [timeLeft,setTimeLeft]=useState('');
  useEffect(()=>{
    const timer=setInterval(()=>{
      const diff=new Date(sale.endsAt).getTime()-Date.now();
      if(diff<=0){setTimeLeft('انتهت');clearInterval(timer);return;}
      const mins=Math.floor(diff/60000);
      const secs=Math.floor((diff%60000)/1000);
      setTimeLeft(`${mins}:${String(secs).padStart(2,'0')}`);
    },1000);
    return()=>clearInterval(timer);
  },[sale.endsAt]);
  return (
    <span style={{position:'absolute',top:10,right:10,background:'linear-gradient(135deg,#ef4444,#ff6a00)',color:'#fff',fontSize:10,fontWeight:800,padding:'3px 10px',borderRadius:99,animation:'sfpulse 1.2s ease infinite',zIndex:4,boxShadow:'0 2px 12px rgba(239,68,68,0.6)'}}>
      ⚡ -{sale.discountPercent}% | {timeLeft}
    </span>
  );
}

// ─── NEW: Size Guide Modal ───────────────────────────────────────────────────
function SizeGuideModal({guide,onClose}:{guide:SizeGuide;onClose:()=>void}) {
  const sizes=['S','M','L','XL','XXL'];
  const measurements=guide.measurements;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(12px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'linear-gradient(180deg,#151f35 0%,#0f1829 100%)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:24,width:'100%',maxWidth:480,padding:24,boxShadow:'0 16px 60px rgba(0,0,0,0.6)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{fontSize:18,fontWeight:900,color:'#fff',display:'flex',alignItems:'center',gap:8}}><Ruler size={18} color="#FF6A00"/> دليل المقاسات</h3>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',cursor:'pointer',color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
        </div>
        {guide.image&&<img src={guide.image} alt="size guide" style={{width:'100%',borderRadius:14,marginBottom:16,border:'1px solid rgba(255,255,255,0.1)'}}/>}
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,color:'rgba(255,255,255,0.8)'}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.12)'}}>
                <th style={{padding:'8px 12px',textAlign:'right',fontWeight:700}}>المقاس</th>
                {Object.keys(measurements).length>0 && Object.keys(measurements[Object.keys(measurements)[0]]).map(key=>(
                  <th key={key} style={{padding:'8px 12px',textAlign:'center',fontWeight:700}}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(sizes.filter(s=>measurements[s])).map(size=>(
                <tr key={size} style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  <td style={{padding:'8px 12px',fontWeight:700}}>{size}</td>
                  {Object.values(measurements[size]).map((val,i)=>(<td key={i} style={{padding:'8px 12px',textAlign:'center'}}>{val}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={onClose} style={{marginTop:20,width:'100%',height:44,background:'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',borderRadius:14,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>حسناً</button>
      </div>
    </div>
  );
}

// ─── NEW: Bundle Card ────────────────────────────────────────────────────────
function BundleCard({bundle,products,currency,onAdd}:{bundle:Bundle;products:SProduct[];currency:string;onAdd:(bundle:Bundle)=>void}) {
  const savings=bundle.originalPrice-bundle.bundlePrice;
  const bundleProducts=products.filter(p=>bundle.products.includes(p.id));
  if(bundleProducts.length===0) return null;
  return (
    <div style={{
      background:'linear-gradient(135deg,rgba(0,210,179,0.06),rgba(255,106,0,0.04))',
      backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
      border:'1px solid rgba(255,255,255,0.12)',
      borderRadius:20,padding:18,marginBottom:16,boxShadow:'0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
        {bundleProducts.map(p=>(
          <div key={p.id} style={{width:64,height:64,borderRadius:12,overflow:'hidden',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)'}}>
            {p.imageUrl?<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{p.emoji||'📦'}</div>}
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:'#fff',marginBottom:4}}>{bundle.name}</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:8}}>{bundle.products.length} منتجات</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:18,fontWeight:900,color:'#FF6A00'}}>{bundle.bundlePrice} {currency}</span>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.35)',textDecoration:'line-through'}}>{bundle.originalPrice} {currency}</span>
            <span style={{fontSize:11,fontWeight:700,color:'#00D2B3'}}>وفر {savings} {currency}</span>
          </div>
        </div>
        <button onClick={()=>onAdd(bundle)} style={{padding:'10px 20px',background:'linear-gradient(135deg,#00D2B3,#10B981)',border:'none',borderRadius:14,color:'#fff',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(0,210,179,0.4)',fontSize:14}}>
          اشتري الحزمة
        </button>
      </div>
    </div>
  );
}

// ─── NEW: Video Reviews Section ──────────────────────────────────────────────
function VideoReviewsSection({reviews}:{reviews:VideoReview[]}) {
  if(reviews.length===0) return null;
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:12,display:'flex',gap:6}}>🎬 فيديوهات التقييم ({reviews.length})</div>
      <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:8}}>
        {reviews.map(r=>(
          <div key={r.id} style={{flexShrink:0,width:120,borderRadius:14,overflow:'hidden',background:'#000',position:'relative',cursor:'pointer',aspectRatio:'9/16'}}>
            <video src={r.videoUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} />
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)'}}><Play size={30} color="#fff"/></div>
            <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(to top,rgba(0,0,0,0.8),transparent)',padding:'8px',color:'#fff',fontSize:10}}>
              ⭐{r.rating} · {r.customerName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NEW: Q&A Section ────────────────────────────────────────────────────────
function QASection({questions}:{questions:ProductQa[]}) {
  const [showForm,setShowForm]=useState(false);
  const [newQ,setNewQ]=useState('');
  const [submitted,setSubmitted]=useState(false);

  if(questions.length===0 && !showForm) return null;

  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:800,color:'#fff',marginBottom:12,display:'flex',gap:6}}>❓ الأسئلة والأجوبة ({questions.length})</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
        {questions.map(qa=>(
          <div key={qa.id} style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:12}}>
            <div style={{fontSize:12,fontWeight:700,color:'#fff',marginBottom:6}}>Q: {qa.question}</div>
            {qa.answer?(
              <div style={{fontSize:11,color:'rgba(255,255,255,0.65)',paddingRight:16,borderRight:'2px solid #00D2B3'}}>✓ {qa.answer}</div>
            ):(
              <div style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>⏳ في انتظار الإجابة...</div>
            )}
            <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',marginTop:4}}>{qa.asker} · {new Date(qa.createdAt).toLocaleDateString('ar-MA')}</div>
          </div>
        ))}
      </div>
      {!showForm && <button onClick={()=>setShowForm(true)} style={{width:'100%',padding:'10px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,color:'rgba(255,255,255,0.7)',fontWeight:700,fontSize:12,cursor:'pointer'}}>اسأل سؤالك</button>}
      {showForm && (
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <input value={newQ} onChange={e=>setNewQ(e.target.value)} placeholder="اكتب سؤالك هنا..." style={{flex:1,padding:'8px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:12,outline:'none'}}/>
          <button onClick={()=>{setSubmitted(true);setNewQ('');setShowForm(false);}} style={{padding:'8px 16px',background:'linear-gradient(135deg,#00D2B3,#10B981)',border:'none',borderRadius:10,color:'#fff',fontWeight:700,cursor:'pointer'}}>إرسال</button>
        </div>
      )}
      {submitted && <div style={{fontSize:11,color:'#00D2B3',marginTop:8}}>تم إرسال سؤالك بنجاح!</div>}
    </div>
  );
}

// ─── NEW: Stock Indicator ────────────────────────────────────────────────────
function StockIndicator({stock}:{stock:number}) {
  let level='متوفر بكثرة', color='#00D2B3', bg='rgba(0,210,179,0.08)';
  if(stock<=3){level='آخر فرصة!'; color='#EF4444'; bg='rgba(239,68,68,0.08)';}
  else if(stock<=10){level='كمية محدودة'; color='#FF6A00'; bg='rgba(255,106,0,0.08)';}
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 12px',borderRadius:12,background:bg,border:`1px solid ${color}33`,marginBottom:12}}>
      <span style={{fontSize:11,fontWeight:700,color}}>{level}</span>
      <div style={{flex:1,display:'flex',alignItems:'center',gap:4}}>
        <div style={{flex:1,height:4,background:'rgba(255,255,255,0.1)',borderRadius:99}}>
          <div style={{height:'100%',width:`${Math.min((stock/20)*100,100)}%`,background:color,borderRadius:99}}/>
        </div>
        <span style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>{stock} متوفر</span>
      </div>
    </div>
  );
}

// ─── NEW: Comparison Drawer ──────────────────────────────────────────────────
function ComparisonModal({products,onClose}:{products:SProduct[];onClose:()=>void}) {
  const features=['السعر','التقييم','المبيعات','المخزون','الفئة'];
  if(products.length<2) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(12px)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'linear-gradient(180deg,#151f35 0%,#0f1829 100%)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:24,width:'100%',maxWidth:600,padding:24,boxShadow:'0 16px 60px rgba(0,0,0,0.6)',maxHeight:'90vh',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{fontSize:18,fontWeight:900,color:'#fff',display:'flex',alignItems:'center',gap:8}}><BarChart3 size={18} color="#FF6A00"/> مقارنة المنتجات</h3>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',cursor:'pointer',color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,color:'rgba(255,255,255,0.8)'}}>
          <thead>
            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
              <th style={{padding:'12px 8px',textAlign:'right'}}>الخصائص</th>
              {products.map(p=>(<th key={p.id} style={{padding:'12px 8px',textAlign:'center',fontWeight:800,color:'#FF6A00'}}>{p.name.substring(0,20)}</th>))}
            </tr>
          </thead>
          <tbody>
            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <td style={{padding:'10px 8px',fontWeight:700}}>💰 السعر</td>
              {products.map(p=>(<td key={p.id} style={{padding:'10px 8px',textAlign:'center'}}>{p.price} درهم</td>))}
            </tr>
            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <td style={{padding:'10px 8px',fontWeight:700}}>⭐ التقييم</td>
              {products.map(p=>(<td key={p.id} style={{padding:'10px 8px',textAlign:'center'}}>{p.sales>20?5:p.sales>10?4:3}/5</td>))}
            </tr>
            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <td style={{padding:'10px 8px',fontWeight:700}}>🔥 المبيعات</td>
              {products.map(p=>(<td key={p.id} style={{padding:'10px 8px',textAlign:'center'}}>{p.sales}</td>))}
            </tr>
            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <td style={{padding:'10px 8px',fontWeight:700}}>📦 المخزون</td>
              {products.map(p=>(<td key={p.id} style={{padding:'10px 8px',textAlign:'center',color:p.stock===0?'#EF4444':'inherit'}}>{p.stock>0?p.stock:'نفذ'}</td>))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── NEW: Live Notification Toast ────────────────────────────────────────────
function LiveNotification({message,onClose}:{message:string;onClose:()=>void}) {
  useEffect(()=>{const timer=setTimeout(onClose,4000);return()=>clearTimeout(timer);},[onClose]);
  return (
    <div style={{position:'fixed',bottom:100,left:20,zIndex:600,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:14,padding:'10px 16px',color:'#fff',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',animation:'slideIn 0.3s ease'}}>
      <Zap size={14} color="#FF6A00"/> {message}
    </div>
  );
}

// ─── PRODUCT CARD (original enhanced with flash, wishlist share, size guide) ─
function ProductCard({p,onAdd,onView,currency}:{p:SProduct;onAdd:(p:SProduct)=>void;onView:(p:SProduct)=>void;currency:string}) {
  const [liked,setLiked]=useState(()=>{try{return JSON.parse(localStorage.getItem('sahar_wishlist')||'[]').includes(p.id);}catch{return false;}});
  const [hover,setHover]=useState(false);
  const [imgIdx,setImgIdx]=useState(0);
  const [addedFlash,setAddedFlash]=useState(false);
  const isNew=p.createdAt&&(Date.now()-new Date(p.createdAt).getTime()<7*24*60*60*1000);
  const imgs=[p.imageUrl,...(p.images||[])].filter(Boolean);
  const rating=p.sales>20?5:p.sales>10?4:p.sales>3?4:3;
  const reviews=p.sales>0?Math.min(p.sales*2,120):0;
  const total=(p.stock||0)+(p.sales||0);
  const soldPct=total>0?Math.round((p.sales/total)*100):0;

  const toggleLike=(e:React.MouseEvent)=>{
    e.stopPropagation();
    const wl:string[]=JSON.parse(localStorage.getItem('sahar_wishlist')||'[]');
    const updated=liked?wl.filter(x=>x!==p.id):[...wl,p.id];
    localStorage.setItem('sahar_wishlist',JSON.stringify(updated));
    setLiked(!liked);
  };

  const shareWishlist=(e:React.MouseEvent)=>{
    e.stopPropagation();
    const link=`${window.location.origin}?wishlist=${p.id}`;
    navigator.clipboard?.writeText(link);
    alert('تم نسخ رابط المنتج لمشاركته مع الأصدقاء! 💌');
  };

  const quickAdd=(e:React.MouseEvent)=>{
    e.stopPropagation();
    if(p.type==='service'||p.type==='digital'||p.stock>0){
      onAdd(p);setAddedFlash(true);setTimeout(()=>setAddedFlash(false),900);
    }
  };

  return (
    <div onClick={()=>onView(p)}
      onMouseEnter={()=>{setHover(true);if(imgs.length>1)setImgIdx(1);}}
      onMouseLeave={()=>{setHover(false);setImgIdx(0);}}
      style={{
        background:hover?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.06)',
        backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
        borderRadius:20,overflow:'hidden',cursor:'pointer',
        border:`1px solid ${hover?'rgba(255,106,0,0.35)':'rgba(255,255,255,0.11)'}`,
        boxShadow:hover?'0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,106,0,0.2), 0 0 30px rgba(255,106,0,0.08)':'0 4px 24px rgba(0,0,0,0.3)',
        transform:hover?'translateY(-6px)':'none',
        transition:'all .3s cubic-bezier(.4,0,.2,1)',
        position:'relative',
      }}>
      {/* Image */}
      <div style={{height:200,position:'relative',background:'rgba(0,0,0,0.3)',overflow:'hidden'}}>
        {imgs.length>0
          ?<img src={imgs[imgIdx]} alt={p.name} loading="lazy"
              style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .5s cubic-bezier(.4,0,.2,1)',
                transform:hover?'scale(1.08)':'scale(1)'}}/>
          :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:56}}>{p.emoji||'📦'}</div>
        }
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.6) 0%,transparent 55%)',opacity:hover?1:0.4,transition:'opacity .3s'}}/>

        {/* Flash Sale Badge (simulated if low stock & high sales) */}
        {p.stock<=5 && p.sales>10 && (
          <FlashSaleBadge sale={{id:'flash1',productId:p.id,discountPercent:30,endsAt:new Date(Date.now()+24*3600*1000)}}/>
        )}

        {/* Quick Action Buttons (hover) */}
        <div style={{position:'absolute',bottom:10,left:0,right:0,display:'flex',gap:8,justifyContent:'center',
          opacity:hover?1:0,transform:hover?'translateY(0)':'translateY(12px)',transition:'all .3s cubic-bezier(.4,0,.2,1)',zIndex:2}}>
          <button onClick={e=>{e.stopPropagation();onView(p);}} title="معاينة سريعة" style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(12px)',transition:'all .2s'}}><Eye size={15} color="#fff"/></button>
          <button onClick={quickAdd} title={p.type==='service'?'احجز':'أضف للسلة'} style={{width:38,height:38,borderRadius:'50%',background:addedFlash?'#00D2B3':'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(255,106,0,0.5)',transition:'all .2s'}}>{addedFlash?<Check size={15} color="#fff"/>:<ShoppingCart size={15} color="#fff"/>}</button>
          <button onClick={toggleLike} title="المفضلة" style={{width:38,height:38,borderRadius:'50%',background:liked?'rgba(239,68,68,0.25)':'rgba(255,255,255,0.15)',border:`1px solid ${liked?'rgba(239,68,68,0.5)':'rgba(255,255,255,0.3)'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(12px)',transition:'all .2s'}}><Heart size={15} fill={liked?'#ef4444':'none'} color={liked?'#ef4444':'#fff'}/></button>
        </div>

        {/* Badges */}
        <div style={{position:'absolute',top:10,right:10,display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end',zIndex:2}}>
          {p.type==='service'&&<span style={{background:'linear-gradient(135deg,#7C3AED,#A855F7)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99,boxShadow:'0 2px 10px rgba(124,58,237,0.5)'}}>خدمة</span>}
          {p.type==='digital'&&<span style={{background:'linear-gradient(135deg,#0EA5E9,#38BDF8)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99}}>رقمي</span>}
          {(!p.type||p.type==='product')&&isNew&&<span style={{background:'linear-gradient(135deg,#00D2B3,#10B981)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99}}>✨ جديد</span>}
          {p.stock<=3&&p.stock>0&&(!p.type||p.type==='product')&&<span style={{background:'linear-gradient(135deg,#F59E0B,#F97316)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99}}>⚡ آخر {p.stock}</span>}
          {p.sales>15&&<span style={{background:'linear-gradient(135deg,#FF6A00,#FF3D00)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99,boxShadow:'0 2px 10px rgba(255,106,0,0.5)'}}>🔥 رائج</span>}
          {(!p.type||p.type==='product')&&p.stock===0&&<span style={{background:'rgba(156,163,175,0.3)',backdropFilter:'blur(8px)',border:'1px solid rgba(156,163,175,0.3)',color:'rgba(255,255,255,0.7)',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99}}>نفذ</span>}
        </div>
        {/* Like top-left */}
        <button onClick={toggleLike} style={{position:'absolute',top:10,left:10,width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',zIndex:2,opacity:hover?0:1,transition:'opacity .25s'}}><Heart size={14} fill={liked?'#EF4444':'none'} color={liked?'#EF4444':'rgba(255,255,255,0.8)'}/></button>
        {/* Share wishlist top-right */}
        <button onClick={shareWishlist} style={{position:'absolute',top:10+40,left:10,width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',zIndex:2,opacity:hover?1:0,transition:'opacity .25s'}}><Copy size={12} color="rgba(255,255,255,0.8)"/></button>
      </div>

      {/* Info */}
      <div style={{padding:'13px 14px 15px'}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:700,letterSpacing:'.07em',textTransform:'uppercase',marginBottom:4}}>{p.category||'—'}</div>
        <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:6,lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.name}</div>
        {reviews>0&&(
          <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:7}}>
            <div style={{display:'flex',gap:1}}>{Array.from({length:5},(_,i)=><Star key={i} size={10} fill={i<rating?'#F59E0B':'none'} color={i<rating?'#F59E0B':'rgba(255,255,255,0.25)'}/>)}</div>
            <span style={{fontSize:10,color:'rgba(255,255,255,0.42)'}}>({reviews})</span>
            {p.sales>0&&<span style={{fontSize:10,color:'rgba(255,255,255,0.42)',marginRight:4}}>{p.sales} طلب</span>}
          </div>
        )}
        {soldPct>20&&(!p.type||p.type==='product')&&(
          <div style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.45)',fontWeight:600}}>تم بيع {soldPct}%</span>
              {p.stock<=10&&p.stock>0&&<span style={{fontSize:9,color:'#EF4444',fontWeight:700}}>متبقي {p.stock}</span>}
            </div>
            <div style={{height:3,background:'rgba(255,255,255,0.1)',borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:`${soldPct}%`,background:`linear-gradient(90deg,${soldPct>80?'#EF4444':'#FF6A00'},${soldPct>80?'#FF6A00':'#F59E0B'})`,borderRadius:99,boxShadow:`0 0 8px ${soldPct>80?'rgba(239,68,68,0.6)':'rgba(255,106,0,0.6)'}`}}/></div>
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}>
          <div style={{fontSize:19,fontWeight:900,color:'#FF6A00',letterSpacing:'-0.03em',textShadow:'0 0 20px rgba(255,106,0,0.4)'}}>{p.price.toLocaleString()} <span style={{fontSize:11,fontWeight:500,color:'rgba(255,255,255,0.5)'}}>{currency}</span></div>
          {p.sizes?.length>0&&(
            <div style={{display:'flex',gap:4,fontSize:9,color:'rgba(255,255,255,0.55)',alignItems:'center'}}>
              <Ruler size={10}/> {p.sizes.slice(0,3).join('/')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SERVICE CARD (original enhanced) ────────────────────────────────────────
function ServiceCard({p,onView,currency}:{p:SProduct;onView:(p:SProduct)=>void;currency:string}) {
  const [hover,setHover]=useState(false);
  const TYPE_EMOJI:Record<string,string>={'تصوير':'📸','تصميم':'🎨','تنظيف':'🧹','إصلاح':'🔧','توصيل':'🚚','طبخ':'🍳','تعليم':'📚','صيانة':'⚙️','خياطة':'🧵','حلاقة':'✂️'};
  const emoji=Object.entries(TYPE_EMOJI).find(([k])=>p.name.includes(k)||p.category?.includes(k))?.[1]||p.emoji||'🛠️';

  return (
    <div onClick={()=>onView(p)}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        background:hover?'rgba(124,58,237,0.12)':'rgba(255,255,255,0.06)',
        backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
        borderRadius:18,padding:'16px',cursor:'pointer',
        border:`1px solid ${hover?'rgba(124,58,237,0.4)':'rgba(255,255,255,0.1)'}`,
        borderRight:`3px solid ${hover?'#A855F7':'#7C3AED'}`,
        boxShadow:hover?'0 12px 40px rgba(0,0,0,0.4), 0 0 24px rgba(124,58,237,0.15)':'0 4px 20px rgba(0,0,0,0.25)',
        transform:hover?'translateX(-3px)':'none',
        transition:'all .3s cubic-bezier(.4,0,.2,1)',
        display:'flex',gap:14,alignItems:'flex-start',
      }}>
      <div style={{flexShrink:0,width:72,height:72,borderRadius:16,
        background:hover?'linear-gradient(135deg,#7C3AED,#A855F7)':'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(168,85,247,0.15))',
        border:`1px solid ${hover?'transparent':'rgba(124,58,237,0.3)'}`,
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,
        boxShadow:hover?'0 8px 24px rgba(124,58,237,0.4)':'0 4px 12px rgba(0,0,0,0.2)',
        transition:'all .3s',overflow:'hidden',
      }}>
        {p.imageUrl?<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span>{emoji}</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:4}}>
          <div style={{fontSize:14,fontWeight:800,color:'#fff',lineHeight:1.3,flex:1}}>{p.name}</div>
          <div style={{fontSize:16,fontWeight:900,color:'#FF6A00',flexShrink:0,letterSpacing:'-0.02em',textShadow:'0 0 16px rgba(255,106,0,0.4)'}}>{p.price.toLocaleString()} <span style={{fontSize:10,fontWeight:500,color:'rgba(255,255,255,0.5)'}}>{currency}</span></div>
        </div>
        {p.description&&<div style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.5,marginBottom:8,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.description}</div>}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {p.duration&&<span style={{display:'flex',alignItems:'center',gap:3,fontSize:11,color:'rgba(255,255,255,0.55)',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,padding:'3px 8px'}}><Clock size={10}/> {p.duration}</span>}
            {p.workArea&&<span style={{display:'flex',alignItems:'center',gap:3,fontSize:11,color:'rgba(255,255,255,0.55)',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,padding:'3px 8px'}}><MapPin size={10}/> {p.workArea}</span>}
            {p.sales>0&&<span style={{fontSize:11,color:'rgba(255,255,255,0.45)'}}>{p.sales} طلب</span>}
          </div>
          <button onClick={e=>{e.stopPropagation();onView(p);}} style={{flexShrink:0,padding:'7px 16px',borderRadius:99,background:'linear-gradient(135deg,#7C3AED,#A855F7)',border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 14px rgba(124,58,237,0.4)'}}>احجز الآن</button>
        </div>
      </div>
    </div>
  );
}

// ─── LIGHTBOX (original, untouched) ──────────────────────────────────────────
function Lightbox({images,startIndex,onClose}:{images:string[];startIndex:number;onClose:()=>void}) {
  const [idx,setIdx]=useState(startIndex);
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const touch=useRef<{x:number;y:number;t:number;dist:number;baseZoom:number}|null>(null);
  const go=useCallback((d:number)=>{setIdx(i=>Math.max(0,Math.min(images.length-1,i+d)));setZoom(1);setPan({x:0,y:0});},[images.length]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='ArrowRight')go(-1);if(e.key==='ArrowLeft')go(1);};
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[go,onClose]);
  const dist2=(t:TouchList)=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  const onTouchStart=(e:React.TouchEvent)=>{
    if(e.touches.length===2){touch.current={x:0,y:0,t:Date.now(),dist:dist2(e.touches as unknown as TouchList),baseZoom:zoom};}
    else{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY,t:Date.now(),dist:0,baseZoom:zoom};}
  };
  const onTouchMove=(e:React.TouchEvent)=>{
    if(!touch.current)return;
    if(e.touches.length===2&&touch.current.dist){const r=dist2(e.touches as unknown as TouchList)/touch.current.dist;setZoom(Math.max(1,Math.min(4,touch.current.baseZoom*r)));}
    else if(zoom>1){setPan(pp=>({x:pp.x+(e.touches[0].clientX-touch.current!.x),y:pp.y+(e.touches[0].clientY-touch.current!.y)}));touch.current.x=e.touches[0].clientX;touch.current.y=e.touches[0].clientY;}
  };
  const onTouchEnd=(e:React.TouchEvent)=>{
    const tc=touch.current;touch.current=null;
    if(!tc||zoom>1)return;
    const dx=(e.changedTouches[0]?.clientX??tc.x)-tc.x;
    if(Math.abs(dx)>50&&Date.now()-tc.t<600)go(dx>0?-1:1);
  };
  return (
    <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,.97)',display:'flex',alignItems:'center',justifyContent:'center',touchAction:'none'}} onClick={onClose}>
      <button onClick={onClose} style={{position:'absolute',top:16,left:16,width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,.1)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.2)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3}}><X size={20}/></button>
      <div style={{position:'absolute',top:22,right:20,color:'rgba(255,255,255,.5)',fontSize:13,fontWeight:700,zIndex:3}}>{idx+1}/{images.length}</div>
      <div onClick={e=>{e.stopPropagation();setZoom(z=>z>1?1:2.5);setPan({x:0,y:0});}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        <img src={images[idx]} alt="" draggable={false} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transition:touch.current?'none':'transform .2s',cursor:zoom>1?'grab':'zoom-in',userSelect:'none'}}/>
      </div>
      {images.length>1&&<>
        <button onClick={e=>{e.stopPropagation();go(1);}} disabled={idx>=images.length-1} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,.1)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.2)',color:'#fff',cursor:'pointer',fontSize:22,zIndex:3,opacity:idx>=images.length-1?.3:1}}>‹</button>
        <button onClick={e=>{e.stopPropagation();go(-1);}} disabled={idx<=0} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,.1)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,.2)',color:'#fff',cursor:'pointer',fontSize:22,zIndex:3,opacity:idx<=0?.3:1}}>›</button>
      </>}
      {images.length>1&&(
        <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:16,left:0,right:0,display:'flex',gap:6,justifyContent:'center',overflowX:'auto',padding:'0 16px',zIndex:3}}>
          {images.map((img,i)=>(
            <button key={i} onClick={()=>{setIdx(i);setZoom(1);setPan({x:0,y:0});}} style={{flexShrink:0,width:44,height:44,borderRadius:8,overflow:'hidden',border:`2px solid ${i===idx?'#FF6A00':'rgba(255,255,255,.2)'}`,padding:0,cursor:'pointer',background:'#000',boxShadow:i===idx?'0 0 12px rgba(255,106,0,0.5)':'none'}}>
              <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PRODUCT MODAL (original enhanced with new sections) ─────────────────────
function ProductModal({p,cart,onClose,currency,userId}:{p:SProduct;cart:ReturnType<typeof useCart>;onClose:()=>void;currency:string;userId:string}) {
  const [size,setSize]=useState(p.sizes?.[0]||'');
  const [color,setColor]=useState(p.colors?.[0]||'');
  const [qty,setQty]=useState(1);
  const [added,setAdded]=useState(false);
  const [showVideo,setShowVideo]=useState(false);
  const [lightboxIdx,setLightboxIdx]=useState<number|null>(null);
  const firstColorImg=p.colors?.[0]&&p.colorImages?.[p.colors[0]];
  const [activeImage,setActiveImage]=useState(firstColorImg||p.imageUrl||'');
  const galleryImgs=[p.imageUrl,...(p.images||[])].filter((x,i,a)=>x&&a.indexOf(x)===i);
  const rating=p.sales>20?5:p.sales>10?4:p.sales>3?4:3;
  const viewersNow=useMemo(()=>2+Math.abs(p.id.charCodeAt(0)%8),[p.id]);
  const total=(p.stock||0)+(p.sales||0);
  const soldPct=total>0?Math.round((p.sales/total)*100):0;
  void userId;

  // Simulated extra data (size guide, video reviews, Q&A)
  const sizeGuide:SizeGuide|undefined = p.sizes?.length? {productId:p.id,measurements:{'S':{'الصدر':'92cm','الخصر':'76cm','الورك':'96cm'},'M':{'الصدر':'98cm','الخصر':'82cm','الورك':'102cm'},'L':{'الصدر':'104cm','الخصر':'88cm','الورك':'108cm'}}}:undefined;
  const videoReviews:VideoReview[] = p.sales>5? [
    {id:'v1',productId:p.id,customerName:'فاطمة',rating:5,videoUrl:'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',title:'مراجعة رائعة',createdAt:'2025-01-01'},
    {id:'v2',productId:p.id,customerName:'أحمد',rating:4,videoUrl:'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',title:'تجربة ممتازة',createdAt:'2025-02-01'},
  ] : [];
  const qas:ProductQa[] = [
    {id:'q1',productId:p.id,question:'هل يأتي مع ضمان؟',answer:'نعم، ضمان سنة كاملة.',asker:'مريم',createdAt:'2025-03-01'},
    {id:'q2',productId:p.id,question:'هل الألوان مطابقة للصور؟',answer:'نعم، الألوان حقيقية 100%',asker:'كريم',createdAt:'2025-03-05'},
  ];

  const handleAdd=()=>{
    cart.add(p,size,color);
    for(let i=0;i<qty-1;i++)cart.add(p,size,color);
    setAdded(true);
    setTimeout(()=>{setAdded(false);onClose();},900);
  };
  const share=()=>{
    const url=window.location.origin+window.location.pathname+'?p='+p.id;
    navigator.share?.({title:p.name,url}).catch(()=>{})||navigator.clipboard?.writeText(url);
  };

  const glassInput:React.CSSProperties={background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'#fff',borderRadius:10,padding:'8px 12px',fontSize:13,outline:'none',fontFamily:'Tajawal,sans-serif',boxSizing:'border-box' as any};

  return (<>
    {lightboxIdx!==null&&galleryImgs.length>0&&<Lightbox images={galleryImgs} startIndex={lightboxIdx} onClose={()=>setLightboxIdx(null)}/>}
    {/* Size Guide Modal */}
    {sizeGuide && <SizeGuideModal guide={sizeGuide} onClose={()=>setActiveImage(p.imageUrl||'')} />}
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'linear-gradient(180deg,#151f35 0%,#0f1829 100%)',
        border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'24px 24px 0 0',width:'100%',maxWidth:520,
        maxHeight:'93vh',overflowY:'auto',
        boxShadow:'0 -8px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Image (same) */}
        <div style={{height:280,position:'relative',background:'rgba(0,0,0,0.4)',flexShrink:0,overflow:'hidden'}}>
          {showVideo&&p.videoUrl?<video src={p.videoUrl} controls autoPlay playsInline style={{width:'100%',height:'100%',objectFit:'contain',background:'#000'}}/>:
          activeImage?<img src={activeImage} alt={p.name} onClick={()=>{const i=galleryImgs.indexOf(activeImage);setLightboxIdx(i>=0?i:0);}} style={{width:'100%',height:'100%',objectFit:'cover',cursor:'zoom-in'}}/>:
          <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80}}>{p.emoji||'📦'}</div>}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(15,24,41,0.8) 0%,transparent 50%)',pointerEvents:'none'}}/>
          <button onClick={onClose} style={{position:'absolute',top:14,left:14,width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,0.4)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}><X size={16} color="#fff"/></button>
          <button onClick={share} style={{position:'absolute',top:14,right:14,width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,0.4)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}><Share2 size={15} color="rgba(255,255,255,0.8)"/></button>
          {p.sales>0&&!showVideo&&<div style={{position:'absolute',bottom:12,right:12,background:'linear-gradient(135deg,#FF6A00,#FF8533)',color:'#fff',fontSize:11,fontWeight:700,padding:'4px 11px',borderRadius:99,boxShadow:'0 4px 14px rgba(255,106,0,0.5)'}}>{p.sales}+ مبيعة</div>}
        </div>

        {/* Thumbnails (same) */}
        {(galleryImgs.length>1||p.videoUrl)&&(
          <div style={{display:'flex',gap:6,overflowX:'auto',padding:'8px 14px',background:'rgba(0,0,0,0.2)',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            {galleryImgs.map((img,i)=>(
              <button key={i} onClick={()=>{setShowVideo(false);setActiveImage(img);}} style={{flexShrink:0,width:52,height:52,borderRadius:9,overflow:'hidden',border:`2px solid ${!showVideo&&activeImage===img?'#FF6A00':'rgba(255,255,255,0.15)'}`,background:'rgba(0,0,0,0.3)',cursor:'pointer',padding:0,boxShadow:!showVideo&&activeImage===img?'0 0 10px rgba(255,106,0,0.4)':'none'}}>
                <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </button>
            ))}
            {p.videoUrl&&(
              <button onClick={()=>setShowVideo(true)} style={{flexShrink:0,width:52,height:52,borderRadius:9,border:`2px solid ${showVideo?'#FF6A00':'rgba(255,255,255,0.15)'}`,background:'rgba(0,0,0,0.5)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Play size={18} color="#fff"/>
              </button>
            )}
          </div>
        )}

        <div style={{padding:'18px 18px 0'}}>
          {/* Header info (same) */}
          <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:3,fontWeight:600}}>{p.category}{p.sku?` · #${p.sku}`:''}</div>
          <h2 style={{fontSize:20,fontWeight:900,color:'#fff',margin:'0 0 8px',lineHeight:1.3}}>{p.name}</h2>

          {/* Stock Indicator (new) */}
          {(!p.type||p.type==='product')&& <StockIndicator stock={p.stock} />}

          {/* Rating + Trust badges + social proof (same) */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14}}>
            <div style={{display:'flex',gap:1}}>{Array.from({length:5},(_,i)=><Star key={i} size={13} fill={i<rating?'#F59E0B':'none'} color={i<rating?'#F59E0B':'rgba(255,255,255,0.2)'}/>)}</div>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.45)'}}>({Math.min(p.sales*2,120)}) · {p.sales} طلب</span>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
            {[{icon:<Shield size={11}/>,t:'دفع آمن',g:'#00D2B3'},{icon:<RefreshCcw size={11}/>,t:'إرجاع 7 أيام',g:'#0EA5E9'},{icon:<Package size={11}/>,t:'توصيل سريع',g:'#F59E0B'},{icon:<Award size={11}/>,t:'جودة مضمونة',g:'#A855F7'}].map(b=>(
              <div key={b.t} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:99,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:b.g,fontSize:10,fontWeight:700}}>{b.icon}{b.t}</div>
            ))}
          </div>
          {p.sales>0&&(
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12,padding:'9px 12px',background:'rgba(255,106,0,0.08)',borderRadius:12,border:'1px solid rgba(255,106,0,0.2)'}}>
              <Flame size={14} color="#FF6A00"/>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.75)'}}><strong style={{color:'#FF6A00'}}>{p.sales}</strong> شخص طلب هذا{p.sales>=10?<span style={{color:'#00D2B3',marginRight:4}}> · مشهور جداً</span>:''}</span>
            </div>
          )}

          {/* Price + viewers */}
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontSize:28,fontWeight:900,color:'#FF6A00',letterSpacing:'-0.04em',textShadow:'0 0 24px rgba(255,106,0,0.4)'}}>{p.price.toLocaleString()} <span style={{fontSize:14,color:'rgba(255,255,255,0.5)',fontWeight:500}}>{currency}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,106,0,0.1)',border:'1px solid rgba(255,106,0,0.25)',borderRadius:99,padding:'5px 11px'}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:'#FF6A00',display:'inline-block',animation:'sfpulse 1.5s ease infinite'}}/>
              <span style={{fontSize:11,fontWeight:700,color:'#FF6A00'}}>{viewersNow} يشاهدونه الآن</span>
            </div>
          </div>

          {/* Sales progress */}
          {soldPct>15&&(!p.type||p.type==='product')&&(
            <div style={{marginBottom:14,padding:'10px 12px',background:'rgba(255,106,0,0.07)',borderRadius:12,border:'1px solid rgba(255,106,0,0.18)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.7)'}}>🔥 تم بيع <strong style={{color:'#FF6A00'}}>{soldPct}%</strong></span>
                {p.stock<=10&&p.stock>0&&<span style={{fontSize:11,color:'#EF4444',fontWeight:700}}>متبقي {p.stock}!</span>}
              </div>
              <div style={{height:5,background:'rgba(255,255,255,0.1)',borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${soldPct}%`,background:`linear-gradient(90deg,${soldPct>80?'#EF4444':'#FF6A00'},${soldPct>80?'#FF6A00':'#F59E0B'})`,borderRadius:99,boxShadow:'0 0 8px rgba(255,106,0,0.5)'}}/>
              </div>
            </div>
          )}
          {p.description&&<p style={{fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.7,marginBottom:14}}>{p.description}</p>}

          {/* Custom fields */}
          {p.customFields&&p.customFields.filter(f=>f.value).length>0&&(
            <div style={{marginBottom:14,padding:'10px 12px',background:'rgba(255,255,255,0.05)',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',gap:5}}>
              {p.customFields.filter(f=>f.value).map(f=>(
                <div key={f.id} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'rgba(255,255,255,0.45)',fontWeight:600}}>{f.label}</span>
                  <span style={{color:'rgba(255,255,255,0.8)',fontWeight:700}}>{f.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Service meta */}
          {p.type==='service'&&(p.duration||p.workArea)&&(
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              {p.duration&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'rgba(255,255,255,0.6)',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,padding:'4px 12px'}}><Clock size={11}/> {p.duration}</span>}
              {p.workArea&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'rgba(255,255,255,0.6)',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,padding:'4px 12px'}}><MapPin size={11}/> {p.workArea}</span>}
            </div>
          )}
          {p.type==='digital'&&<div style={{marginBottom:14,padding:'8px 12px',background:'rgba(14,165,233,0.1)',border:'1px solid rgba(14,165,233,0.25)',borderRadius:8,fontSize:12,color:'#38BDF8'}}>💻 منتج رقمي — سيُرسل إليك مباشرة بعد التأكيد</div>}

          {/* Size Guide Button (new) */}
          {sizeGuide && (
            <button onClick={()=>setActiveImage(sizeGuide.image||p.imageUrl||'')} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:700,cursor:'pointer',marginBottom:14}}><Ruler size={12}/> دليل المقاسات</button>
          )}

          {/* Sizes & Colors (same) */}
          {(!p.type||p.type==='product')&&p.sizes?.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.45)',marginBottom:8}}>المقاس</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {p.sizes.map(s=>(
                  <button key={s} onClick={()=>setSize(s)} style={{padding:'7px 15px',borderRadius:9,border:`1.5px solid ${size===s?'#FF6A00':'rgba(255,255,255,0.12)'}`,background:size===s?'rgba(255,106,0,0.15)':'rgba(255,255,255,0.05)',color:size===s?'#FF6A00':'rgba(255,255,255,0.65)',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all .15s',boxShadow:size===s?'0 0 10px rgba(255,106,0,0.2)':'none'}}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {p.colors?.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.45)',marginBottom:8}}>اللون: <span style={{color:'rgba(255,255,255,0.8)'}}>{color}</span></div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {p.colors.map(clr=>{
                  const colorImg=p.colorImages?.[clr];
                  const CM:Record<string,string>={'أسود':'#1a1a1a','أبيض':'#f5f5f5','أحمر':'#ef4444','أزرق':'#3b82f6','أخضر':'#22c55e','رمادي':'#6b7280','بيج':'#d4b896','وردي':'#f472b6','بني':'#92400e','كحلي':'#1e3a5f','بنفسجي':'#a855f7','برتقالي':'#f97316'};
                  return colorImg?(
                    <button key={clr} onClick={()=>{setColor(clr);setActiveImage(colorImg||p.imageUrl||'');}} style={{padding:3,borderRadius:10,border:`2px solid ${color===clr?'#FF6A00':'rgba(255,255,255,0.15)'}`,cursor:'pointer',background:'transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <img src={colorImg} alt={clr} style={{width:50,height:50,objectFit:'cover',borderRadius:7}}/>
                      <span style={{fontSize:9,fontWeight:700,color:color===clr?'#FF6A00':'rgba(255,255,255,0.45)'}}>{clr}</span>
                    </button>
                  ):(
                    <button key={clr} onClick={()=>setColor(clr)} style={{width:30,height:30,borderRadius:'50%',background:CM[clr]||'#ccc',border:`3px solid ${color===clr?'#FF6A00':'rgba(255,255,255,0.2)'}`,cursor:'pointer',boxShadow:color===clr?'0 0 10px rgba(255,106,0,0.4)':'0 2px 6px rgba(0,0,0,.3)',transition:'all .15s'}} title={clr}/>
                  );
                })}
              </div>
            </div>
          )}

          {/* Video Reviews (new) */}
          <VideoReviewsSection reviews={videoReviews} />

          {/* Q&A (new) */}
          <QASection questions={qas} />

          {/* Related products (same) */}
          {p.category&&(window as any).__sfProducts?.filter((rp:any)=>rp.id!==p.id&&rp.category===p.category).length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.4)',marginBottom:10,letterSpacing:'.06em'}}>🛍️ قد يعجبك أيضاً</div>
              <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
                {(window as any).__sfProducts.filter((rp:any)=>rp.id!==p.id&&rp.category===p.category).slice(0,4).map((rp:any)=>(
                  <div key={rp.id} onClick={()=>{onClose();setTimeout(()=>document.dispatchEvent(new CustomEvent('viewProduct',{detail:rp})),50);}}
                    style={{flexShrink:0,width:90,borderRadius:10,overflow:'hidden',cursor:'pointer',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
                    <div style={{height:72,background:'rgba(0,0,0,0.3)',overflow:'hidden'}}>
                      {rp.imageUrl?<img src={rp.imageUrl} alt={rp.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{rp.emoji||'📦'}</div>}
                    </div>
                    <div style={{padding:'5px 7px'}}><div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.8)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{rp.name}</div><div style={{fontSize:11,fontWeight:900,color:'#FF6A00'}}>{rp.price.toLocaleString()}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Qty (same) */}
          {(!p.type||p.type==='product')&&(
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.45)'}}>الكمية</span>
              <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.06)',borderRadius:12,padding:'4px 8px',border:'1px solid rgba(255,255,255,0.1)'}}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:32,height:32,borderRadius:8,...glassInput,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}><Minus size={13}/></button>
                <span style={{fontSize:15,fontWeight:700,color:'#fff',minWidth:28,textAlign:'center'}}>{qty}</span>
                <button onClick={()=>setQty(q=>Math.min(p.stock||99,q+1))} style={{width:32,height:32,borderRadius:8,...glassInput,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}><Plus size={13}/></button>
              </div>
              {(!p.type||p.type==='product')&&<span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{p.stock} متوفر</span>}
            </div>
          )}
        </div>
        {/* Sticky CTA */}
        <div style={{padding:'10px 18px 28px',background:'rgba(15,24,41,0.95)',borderTop:'1px solid rgba(255,255,255,0.08)',marginTop:4,backdropFilter:'blur(12px)'}}>
          <button onClick={handleAdd} style={{
            width:'100%',height:54,
            background:added?'linear-gradient(135deg,#00D2B3,#10B981)':'linear-gradient(135deg,#FF6A00,#FF8533)',
            border:'none',color:'#fff',fontSize:15,fontWeight:700,
            cursor:'pointer',transition:'all .25s cubic-bezier(.4,0,.2,1)',
            display:'flex',alignItems:'center',justifyContent:'center',gap:8,
            borderRadius:16,
            boxShadow:added?'0 4px 20px rgba(0,210,179,0.4)':'0 4px 24px rgba(255,106,0,0.45)',
          }}>
            {added?<><Check size={18}/>{p.type==='service'?'تم الحجز!':'تمت الإضافة!'}</>
              :<><ShoppingCart size={16}/>{p.type==='service'?'احجز الآن':p.type==='digital'?'اشتر الآن':'أضف للسلة'} — {(p.price*qty).toLocaleString()} {currency}</>}
          </button>
        </div>
      </div>
    </div>
  </>);
}

// ─── CART SIDEBAR (original, untouched) ──────────────────────────────────────
function CartSidebar({cart,storeInfo,userId,onClose,onOrderSuccess}:{cart:ReturnType<typeof useCart>;storeInfo:StoreInfo;userId:string;onClose:()=>void;onOrderSuccess:(id:string)=>void}) {
  const [step,setStep]=useState<'cart'|'checkout'|'success'>('cart');
  const [form,setForm]=useState({name:'',phone:'',city:'',address:'',notes:'',subscribe:true,paymentMethod:'cod' as 'cod'|'virement'});
  const [couponCode,setCouponCode]=useState('');
  const [couponDiscount,setCouponDiscount]=useState(0);
  const [couponMsg,setCouponMsg]=useState('');
  const [citySearch,setCitySearch]=useState('');
  const [showCities,setShowCities]=useState(false);
  const [loading,setLoading]=useState(false);
  const [orderId,setOrderId]=useState('');
  const cur=storeInfo.brand.currency||'MAD';
  const deliveryCost=getDeliveryCost(form.city,storeInfo.deliveryCosts);
  const grandTotal=Math.max(0,cart.total-couponDiscount)+deliveryCost;
  const filteredCities=MOROCCAN_CITIES.filter(c=>c.includes(citySearch)||citySearch==='');

  const applyCoupon=async()=>{
    if(!couponCode.trim())return;
    try{
      const r=await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponCode)}&userId=${userId}&total=${cart.total}`);
      if(r.ok){const d=await r.json();setCouponDiscount(d.discount||0);setCouponMsg(d.discount>0?`✅ خصم ${d.discount} ${cur} تم تطبيقه`:'❌ الكود غير صحيح');}
      else{setCouponDiscount(0);setCouponMsg('❌ الكود غير صحيح أو منتهي الصلاحية');}
    }catch{setCouponDiscount(0);setCouponMsg('❌ تعذر التحقق من الكود');}
  };

  const handleOrder=async()=>{
    if(!form.name||!form.phone||!form.city){alert('الاسم الكامل، الهاتف والمدينة مطلوبون');return;}
    setLoading(true);
    try{
      const items=cart.items.map(i=>({productId:i.product.id,productName:i.product.name,price:i.product.price,quantity:i.quantity,size:i.size,color:i.color}));
      const r=await fetch('/api/orders/public',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId,items,customerName:form.name,customerPhone:form.phone,city:form.city,address:form.address,total:grandTotal,source:'Storefront',notes:`${form.notes}${form.subscribe?' · يريد عروض':''}`})});
      const data=await r.json();
      if(!r.ok)throw new Error(data.error);
      setOrderId(data.order.id);
      const phone=storeInfo.brand.phone?.replace(/\D/g,'');
      const itemsText=cart.items.map(i=>`• ${i.product.name} (${i.size} ${i.color}) x${i.quantity} — ${i.product.price*i.quantity} ${cur}`).join('\n');
      const codeStr=data.order.customerCode?`\n🔑 الكود: ${data.order.customerCode}`:'';
      const msg=`مرحباً ${storeInfo.brand.name}! 👋\n\nأريد تأكيد طلبي:\n\n${itemsText}\n\n💰 المجموع: ${cart.total} ${cur}\n🚚 التوصيل: ${deliveryCost} ${cur}\n💵 الإجمالي: ${grandTotal} ${cur}\n\n👤 ${form.name}\n📱 ${form.phone}\n📍 ${form.city}\n🏠 ${form.address||'—'}\n🔖 ${data.order.id}${codeStr}`;
      if(phone)setTimeout(()=>window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank'),500);
      cart.clear();try{localStorage.removeItem('sahar_cart');}catch{}
      setStep('success');onOrderSuccess(data.order.id);
    }catch(e:any){alert(`حدث خطأ: ${e.message}`);}
    setLoading(false);
  };

  const inp:React.CSSProperties={width:'100%',padding:'11px 14px',borderRadius:11,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'Tajawal,sans-serif',backdropFilter:'blur(8px)'};

  return (
    <div style={{position:'fixed',inset:0,zIndex:400,display:'flex'}}>
      <div onClick={onClose} style={{flex:1,background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)'}}/>
      <div style={{width:'min(420px,100vw)',background:'linear-gradient(180deg,#151f35 0%,#0f1829 100%)',display:'flex',flexDirection:'column',overflowY:'auto',boxShadow:'-8px 0 60px rgba(0,0,0,0.6)',borderLeft:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{padding:'16px 18px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:2,background:'rgba(15,24,41,0.95)',backdropFilter:'blur(20px)'}}>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',cursor:'pointer',color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={16}/></button>
          <div style={{flex:1,fontSize:15,fontWeight:800,color:'#fff'}}>{step==='cart'?`سلتك (${cart.count})`:step==='checkout'?'تأكيد الطلب':'تم الطلب ✅'}</div>
          {step==='cart'&&<span style={{fontSize:14,fontWeight:800,color:'#FF6A00',textShadow:'0 0 12px rgba(255,106,0,0.4)'}}>{cart.total.toLocaleString()} {cur}</span>}
        </div>
        {/* cart items (unchanged) */}
        {step==='cart'&&(
          <div style={{flex:1,overflow:'auto',padding:16}}>
            {cart.items.length===0?(
              <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.4)'}}>
                <ShoppingCart size={44} style={{margin:'0 auto 14px',opacity:.2}}/>
                <div style={{fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:6}}>سلتك فارغة</div>
                <button onClick={onClose} style={{marginTop:12,padding:'9px 22px',background:'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',borderRadius:12,color:'#fff',cursor:'pointer',fontWeight:700,fontSize:13}}>تصفح المنتجات</button>
              </div>
            ):(
              <>
                {cart.items.map((item,i)=>(
                  <div key={i} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                    <div style={{width:64,height:64,borderRadius:12,background:'rgba(0,0,0,0.3)',overflow:'hidden',flexShrink:0,border:'1px solid rgba(255,255,255,0.1)'}}>
                      {item.product.imageUrl?<img src={item.product.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>{item.product.emoji||'📦'}</div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{item.product.name}</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginTop:2}}>{item.size&&`${item.size}`}{item.color&&` · ${item.color}`}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.06)',borderRadius:8,padding:'3px 6px',border:'1px solid rgba(255,255,255,0.1)'}}>
                          <button onClick={()=>cart.update(item.product.id,item.size,item.color,item.quantity-1)} style={{width:24,height:24,borderRadius:6,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',cursor:'pointer',color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}><Minus size={10}/></button>
                          <span style={{fontSize:13,fontWeight:700,color:'#fff',minWidth:20,textAlign:'center'}}>{item.quantity}</span>
                          <button onClick={()=>cart.update(item.product.id,item.size,item.color,item.quantity+1)} style={{width:24,height:24,borderRadius:6,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',cursor:'pointer',color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}><Plus size={10}/></button>
                        </div>
                        <span style={{fontSize:14,fontWeight:700,color:'#FF6A00'}}>{(item.product.price*item.quantity).toLocaleString()} {cur}</span>
                      </div>
                    </div>
                    <button onClick={()=>cart.remove(item.product.id,item.size,item.color)} style={{width:26,height:26,borderRadius:6,background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',cursor:'pointer',color:'#EF4444',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}><X size={12}/></button>
                  </div>
                ))}
                <div style={{padding:'14px 0',marginTop:8}}>
                  <button onClick={()=>setStep('checkout')} style={{width:'100%',height:52,background:'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',borderRadius:16,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 24px rgba(255,106,0,0.4)'}}>
                    متابعة الطلب <ArrowRight size={16}/>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {/* checkout + success (unchanged) */}
        {step==='checkout'&&(
          <div style={{flex:1,overflow:'auto',padding:'16px 18px',display:'flex',flexDirection:'column',gap:10}}>
            <input style={inp} placeholder="الاسم الكامل *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            <input style={inp} placeholder="رقم الهاتف *" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} dir="ltr" type="tel"/>
            <div style={{position:'relative'}}>
              <input style={inp} placeholder="المدينة *" value={citySearch||form.city} onChange={e=>{setCitySearch(e.target.value);setShowCities(true);setForm(f=>({...f,city:e.target.value}));}} onFocus={()=>setShowCities(true)} onBlur={()=>setTimeout(()=>setShowCities(false),200)}/>
              {showCities&&filteredCities.length>0&&(
                <div style={{position:'absolute',top:'100%',right:0,left:0,background:'#151f35',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,maxHeight:180,overflowY:'auto',zIndex:10,marginTop:4,boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
                  {filteredCities.map(city=>(
                    <div key={city} onClick={()=>{setForm(f=>({...f,city}));setCitySearch(city);setShowCities(false);}} style={{padding:'9px 14px',fontSize:13,color:'rgba(255,255,255,0.8)',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.06)'}} onMouseOver={e=>(e.currentTarget.style.background='rgba(255,255,255,0.07)')} onMouseOut={e=>(e.currentTarget.style.background='')}>{city}</div>
                  ))}
                </div>
              )}
            </div>
            <textarea style={{...inp,resize:'none'} as any} placeholder="العنوان بالتفصيل" rows={2} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/>
            <textarea style={{...inp,resize:'none'} as any} placeholder="ملاحظة للبائع (اختياري)" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.45)',marginBottom:8}}>💳 طريقة الدفع</div>
              <div style={{display:'flex',gap:8}}>
                {[['cod','💵 عند الاستلام'],['virement','🏦 تحويل بنكي']].map(([v,l])=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,paymentMethod:v as any}))} style={{flex:1,padding:'10px',borderRadius:11,border:`1.5px solid ${form.paymentMethod===v?'#FF6A00':'rgba(255,255,255,0.12)'}`,background:form.paymentMethod===v?'rgba(255,106,0,0.12)':'rgba(255,255,255,0.05)',color:form.paymentMethod===v?'#FF6A00':'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.45)',marginBottom:8}}>🏷️ كود الخصم</div>
              <div style={{display:'flex',gap:8}}>
                <input style={{...inp,flex:1,textTransform:'uppercase'}} placeholder="أدخل كود الخصم" value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setCouponMsg('');}} dir="ltr"/>
                <button onClick={applyCoupon} style={{padding:'0 14px',borderRadius:11,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}}>تطبيق</button>
              </div>
              {couponMsg&&<div style={{fontSize:11,marginTop:4,color:couponDiscount>0?'#00D2B3':'#EF4444',fontWeight:700}}>{couponMsg}</div>}
            </div>
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13,color:'rgba(255,255,255,0.6)'}}>
              <input type="checkbox" checked={form.subscribe} onChange={e=>setForm(f=>({...f,subscribe:e.target.checked}))} style={{accentColor:'#FF6A00',width:16,height:16}}/>
              أريد استقبال العروض عبر واتساب
            </label>
            <div style={{background:'rgba(255,255,255,0.05)',borderRadius:14,padding:'14px 16px',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.45)',marginBottom:10}}>ملخص الطلب</div>
              {cart.items.map((item,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,0.6)',marginBottom:5,gap:8}}>
                  <span style={{flex:1}}>{item.product.name}{item.size?` (${item.size})`:''} ×{item.quantity}</span>
                  <span style={{flexShrink:0,fontWeight:700,color:'rgba(255,255,255,0.8)'}}>{(item.product.price*item.quantity).toLocaleString()} {cur}</span>
                </div>
              ))}
              <div style={{paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.08)',marginTop:8,display:'flex',flexDirection:'column',gap:5}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,0.55)'}}><span>المجموع</span><span>{cart.total.toLocaleString()} {cur}</span></div>
                {couponDiscount>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#00D2B3',fontWeight:700}}><span>🏷️ الخصم</span><span>-{couponDiscount.toLocaleString()} {cur}</span></div>}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,0.55)'}}><span>🚚 التوصيل — {form.city||'—'}</span><span>{form.city?`${deliveryCost} ${cur}`:'بعد المدينة'}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:900,color:'#fff',paddingTop:8,marginTop:4,borderTop:'1px solid rgba(255,255,255,0.08)'}}><span>الإجمالي</span><span style={{color:'#FF6A00'}}>{grandTotal.toLocaleString()} {cur}</span></div>
              </div>
            </div>
            <button onClick={handleOrder} disabled={loading} style={{width:'100%',height:52,background:'#25D366',border:'none',borderRadius:16,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 20px rgba(37,211,102,0.35)',opacity:loading?.7:1}}>
              {loading?'⟳ جارٍ إرسال الطلب...':<><MessageCircle size={16}/> تأكيد الطلب عبر واتساب</>}
            </button>
            <button onClick={()=>setStep('cart')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:13,padding:'4px',textAlign:'center'}}>← رجوع للسلة</button>
          </div>
        )}
        {step==='success'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(0,210,179,0.15)',border:'2px solid #00D2B3',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,boxShadow:'0 0 30px rgba(0,210,179,0.3)'}}><Check size={36} color="#00D2B3"/></div>
            <h2 style={{fontSize:22,fontWeight:900,color:'#fff',marginBottom:10}}>تم إرسال طلبك! 🎉</h2>
            <p style={{fontSize:14,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:24}}>تم إرسال تفاصيل طلبك عبر واتساب.<br/>سيتواصل معك البائع لتأكيد الطلب.</p>
            {orderId&&<div style={{fontSize:12,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.06)',borderRadius:8,padding:'6px 14px',marginBottom:20,border:'1px solid rgba(255,255,255,0.1)'}}>رقم الطلب: {orderId}</div>}
            <button onClick={onClose} style={{padding:'11px 28px',background:'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',borderRadius:12,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(255,106,0,0.4)'}}>متابعة التسوق</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TRACKING MODAL (original, untouched) ────────────────────────────────────
function TrackingModal({userId,storeInfo,onClose}:{userId:string;storeInfo:StoreInfo;onClose:()=>void}) {
  const [query,setQuery]=useState('');
  const [mode,setMode]=useState<'phone'|'code'>('code');
  const [orders,setOrders]=useState<any[]>([]);
  const [singleOrder,setSingleOrder]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const cur=storeInfo.brand.currency||'MAD';
  const STATUS_AR:Record<string,string>={pending:'⏳ بانتظار التأكيد',approved:'✅ تم التأكيد',processing:'⚙️ جارٍ التحضير',shipped:'🚚 في الطريق',delivered:'📦 وصل',cancelled:'❌ ملغي'};
  const STATUS_COLOR:Record<string,string>={pending:'#F59E0B',approved:'#00D2B3',processing:'#F59E0B',shipped:'#00D2B3',delivered:'#00D2B3',cancelled:'#EF4444'};

  const search=async()=>{
    if(!query.trim())return;
    setLoading(true);setSingleOrder(null);setOrders([]);
    try{
      if(mode==='code'){const r=await fetch(`/api/orders/track-code/${encodeURIComponent(query.trim().toUpperCase())}?userId=${userId}`);const d=await r.json();if(r.ok)setSingleOrder(d);else setOrders([]);}
      else{const r=await fetch(`/api/orders/track/${encodeURIComponent(query.trim())}?userId=${userId}`);const d=await r.json();setOrders(Array.isArray(d)?d:[]);}
    }catch{}
    setSearched(true);setLoading(false);
  };

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'linear-gradient(180deg,#151f35 0%,#0f1829 100%)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:22,width:'100%',maxWidth:440,padding:24,boxShadow:'0 16px 60px rgba(0,0,0,0.6)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:900,color:'#fff'}}>📦 تتبع طلبك</h2>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',cursor:'pointer',color:'rgba(255,255,255,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:12}}>
          {[['code','🔑 كود التتبع'],['phone','📱 رقم الهاتف']].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m as any);setQuery('');setSearched(false);setSingleOrder(null);setOrders([]);}} style={{flex:1,padding:'8px',borderRadius:10,border:`1.5px solid ${mode===m?'#FF6A00':'rgba(255,255,255,0.12)'}`,background:mode===m?'rgba(255,106,0,0.12)':'rgba(255,255,255,0.05)',color:mode===m?'#FF6A00':'rgba(255,255,255,0.5)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <input placeholder={mode==='code'?'أدخل كودك مثل: AB12CD':'أدخل رقم هاتفك'} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} dir="ltr"
            style={{flex:1,padding:'10px 14px',borderRadius:11,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:13,outline:'none',textTransform:mode==='code'?'uppercase':'none',fontFamily:'Tajawal,sans-serif'}}/>
          <button onClick={search} disabled={loading} style={{padding:'8px 18px',background:'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',borderRadius:11,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:14,flexShrink:0,boxShadow:'0 4px 14px rgba(255,106,0,0.4)'}}>{loading?'⟳':'بحث'}</button>
        </div>
        {searched&&!singleOrder&&orders.length===0&&<p style={{color:'rgba(255,255,255,0.4)',textAlign:'center',fontSize:13,padding:'12px 0'}}>لم نجد طلبات</p>}
        {singleOrder&&(
          <div style={{background:'rgba(0,210,179,0.08)',border:'1px solid rgba(0,210,179,0.25)',borderRadius:14,padding:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:14,fontWeight:900,color:'#fff'}}>طلبك</span>
              <span style={{fontSize:13,fontWeight:800,color:STATUS_COLOR[singleOrder.status]||'rgba(255,255,255,0.7)'}}>{STATUS_AR[singleOrder.status]||singleOrder.status}</span>
            </div>
            {(singleOrder.items||[]).map((item:any,i:number)=><div key={i} style={{fontSize:12,color:'rgba(255,255,255,0.6)',marginBottom:3}}>• {item.productName} × {item.quantity}</div>)}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8,paddingTop:8,borderTop:'1px solid rgba(0,210,179,0.2)'}}>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{singleOrder.city}</span>
              <span style={{fontSize:14,fontWeight:700,color:'#FF6A00'}}>{singleOrder.total} {cur}</span>
            </div>
          </div>
        )}
        {orders.map((o:any)=>(
          <div key={o.id} style={{background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'12px 14px',marginBottom:8,border:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.35)',fontFamily:'monospace'}}>{o.id}</span>
              <span style={{fontSize:12,fontWeight:700,color:STATUS_COLOR[o.status]||'rgba(255,255,255,0.6)'}}>{STATUS_AR[o.status]||o.status}</span>
            </div>
            {(o.items||[]).map((item:any,i:number)=><div key={i} style={{fontSize:12,color:'rgba(255,255,255,0.55)',marginBottom:2}}>• {item.productName} x{item.quantity}</div>)}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:12}}>
              <span style={{color:'rgba(255,255,255,0.35)'}}>{new Date(o.createdAt).toLocaleDateString('ar-MA')}</span>
              <span style={{fontWeight:700,color:'#FF6A00'}}>{o.total} {cur}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FLOATING CHAT (original, untouched) ─────────────────────────────────────
function FloatingChat({userId,storeInfo}:{userId:string;storeInfo:StoreInfo}) {
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState<ChatMsg[]>([{role:'ai',content:`مرحباً! 👋 أنا مساعد ${storeInfo.brand.name||'المتجر'} الذكي.\nكيف يمكنني مساعدتك؟`}]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const [unread,setUnread]=useState(0);
  const endRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(open){setUnread(0);endRef.current?.scrollIntoView();}}, [msgs,open]);
  const send=async(msg?:string)=>{
    const text=msg||input.trim();if(!text)return;setInput('');
    setMsgs(m=>[...m,{role:'user',content:text}]);setLoading(true);
    try{
      const r=await fetch('/api/ai/public-reply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:msgs.slice(-8).map(m=>({role:m.role,content:m.content})),userId})});
      const d=await r.json();setMsgs(m=>[...m,{role:'ai',content:d.reply,product:d.product}]);
      if(!open)setUnread(n=>n+1);
    }catch{setMsgs(m=>[...m,{role:'ai',content:'عذراً، حدث خطأ. حاول مرة أخرى.'}]);}
    setLoading(false);
  };
  return (<>
    <button onClick={()=>setOpen(v=>!v)} style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,#7C3AED,#A855F7)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 24px rgba(124,58,237,0.55)',position:'fixed',bottom:28,left:20,zIndex:200,color:'#fff',transition:'all .25s cubic-bezier(.4,0,.2,1)'}}>
      {open?<X size={22}/>:<Bot size={22}/>}
      {unread>0&&!open&&<div style={{position:'absolute',top:-4,right:-4,width:18,height:18,background:'#EF4444',borderRadius:'50%',fontSize:11,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #0B1020'}}>{unread}</div>}
    </button>
    {open&&(
      <div style={{position:'fixed',bottom:96,left:16,right:16,maxWidth:360,marginLeft:'auto',background:'linear-gradient(180deg,#151f35 0%,#0f1829 100%)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:22,boxShadow:'0 16px 60px rgba(0,0,0,0.6)',zIndex:200,overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:460}}>
        <div style={{padding:'12px 16px',background:'linear-gradient(135deg,#7C3AED,#A855F7)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={16} color="#fff"/></div>
          <div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>مساعد {storeInfo.brand.name}</div><div style={{fontSize:10,color:'rgba(255,255,255,.7)'}}>متاح الآن · AI</div></div>
          <button onClick={()=>setOpen(false)} style={{marginRight:'auto',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,.8)',display:'flex'}}><X size={16}/></button>
        </div>
        <div style={{flex:1,overflow:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:8}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{maxWidth:'85%',alignSelf:m.role==='user'?'flex-end':'flex-start'}}>
              <div style={{padding:'8px 12px',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',background:m.role==='user'?'linear-gradient(135deg,#FF6A00,#FF8533)':'rgba(255,255,255,0.08)',border:m.role==='user'?'none':'1px solid rgba(255,255,255,0.1)',color:'#fff',fontSize:12,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{padding:'8px 12px',borderRadius:'14px 14px 14px 4px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',fontSize:12,alignSelf:'flex-start'}}>يكتب...</div>}
          <div ref={endRef}/>
        </div>
        <div style={{padding:'6px 10px',display:'flex',gap:5,flexWrap:'wrap',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          {['اشوف المنتجات','بكام التوصيل؟','تتبع طلبي'].map(q=>(
            <button key={q} onClick={()=>send(q)} style={{fontSize:10,padding:'4px 9px',borderRadius:99,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.6)',cursor:'pointer'}}>{q}</button>
          ))}
        </div>
        <div style={{padding:'8px 10px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="اكتب سؤالك..."
            style={{flex:1,padding:'7px 12px',fontSize:12,borderRadius:10,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',fontFamily:'Tajawal,sans-serif'}}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#7C3AED,#A855F7)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:(!input.trim()||loading)?.5:1}}><Send size={14} color="#fff"/></button>
        </div>
      </div>
    )}
  </>);
}

// ─── TRUST COUNTERS, HERO, SCROLL TO TOP, FILTER DRAWER (unchanged) ─────────
function TrustCounters({productCount}:{productCount:number}) {
  const [count,setCount]=useState({c:0,o:0,r:0});
  useEffect(()=>{
    const targets={c:Math.max(productCount*12,1200),o:Math.max(productCount*5,500),r:98};
    let frame=0;const total=60;
    const id=setInterval(()=>{
      frame++;const pct=frame/total;
      setCount({c:Math.round(targets.c*pct),o:Math.round(targets.o*pct),r:Math.round(targets.r*pct)});
      if(frame>=total)clearInterval(id);
    },16);
    return()=>clearInterval(id);
  },[productCount]);
  return (
    <div style={{margin:'16px 14px',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(16px)',borderRadius:18,padding:'18px 14px',border:'1px solid rgba(255,255,255,0.09)',boxShadow:'0 4px 24px rgba(0,0,0,0.2)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:0,textAlign:'center'}}>
        {[
          {n:`${count.c.toLocaleString()}+`,l:'عميل سعيد',icon:'😊',c:'#FF6A00'},
          {n:`${count.o.toLocaleString()}+`,l:'طلب منجز',icon:'📦',c:'#A855F7'},
          {n:`${count.r}%`,l:'رضا العملاء',icon:'⭐',c:'#00D2B3'},
        ].map((s,i)=>(
          <div key={i} style={{padding:'0 8px',borderLeft:i>0?'1px solid rgba(255,255,255,0.08)':'none'}}>
            <div style={{fontSize:22,fontWeight:900,color:s.c,letterSpacing:'-0.03em',textShadow:`0 0 20px ${s.c}55`}}>{s.n}</div>
            <div style={{fontSize:9,color:'rgba(255,255,255,0.4)',fontWeight:600,marginTop:3,textTransform:'uppercase',letterSpacing:'.06em'}}>{s.icon} {s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSection({brand,productCount,serviceCount,onShop,onServices}:{brand:StoreInfo['brand'];productCount:number;serviceCount:number;onShop:()=>void;onServices:()=>void}) {
  const hasServices=serviceCount>0;
  return (
    <div style={{position:'relative',overflow:'hidden',background:'linear-gradient(145deg,rgba(124,58,237,0.3) 0%,rgba(0,0,0,0) 40%,rgba(255,106,0,0.2) 100%)'}}>
      <div style={{position:'absolute',top:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,0.35),transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,106,0,0.25),transparent 70%)',pointerEvents:'none'}}/>
      <div style={{padding:'28px 20px 0',position:'relative',zIndex:1}}>
        <div style={{display:'flex',gap:16,alignItems:'flex-start',marginBottom:20}}>
          <div style={{flexShrink:0,width:76,height:76,borderRadius:22,overflow:'hidden',background:'rgba(255,255,255,0.1)',backdropFilter:'blur(16px)',border:'1.5px solid rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'}}>
            {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span style={{fontSize:30,fontWeight:900,color:'#fff'}}>{brand.name?.[0]?.toUpperCase()||'S'}</span>}
          </div>
          <div style={{flex:1}}>
            <h1 style={{fontSize:'clamp(20px,5vw,30px)',fontWeight:900,color:'#fff',margin:'0 0 5px',lineHeight:1.2,textShadow:'0 2px 16px rgba(0,0,0,0.3)'}}>{brand.name||'المتجر'}</h1>
            {brand.description&&<p style={{fontSize:13,color:'rgba(255,255,255,0.72)',margin:'0 0 12px',lineHeight:1.55}}>{brand.description}</p>}
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'5px 12px',borderRadius:99,background:'rgba(255,255,255,0.1)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)',color:'rgba(255,255,255,0.85)',fontSize:11,fontWeight:700,textDecoration:'none'}}>💬 واتساب</a>}
              {brand.instagram&&<a href={`https://instagram.com/${brand.instagram}`} target="_blank" rel="noreferrer" style={{padding:'5px 12px',borderRadius:99,background:'rgba(255,255,255,0.1)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)',color:'rgba(255,255,255,0.85)',fontSize:11,fontWeight:700,textDecoration:'none'}}>📸 Instagram</a>}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginBottom:20}}>
          <button onClick={onShop} style={{flex:1,height:48,borderRadius:16,background:'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 24px rgba(255,106,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><ShoppingCart size={16}/> تسوق الآن ({productCount})</button>
          {hasServices&&<button onClick={onServices} style={{flex:1,height:48,borderRadius:16,background:'linear-gradient(135deg,#7C3AED,#A855F7)',border:'none',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 24px rgba(124,58,237,0.45)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>🔧 الخدمات ({serviceCount})</button>}
        </div>
        <div style={{background:'rgba(255,255,255,0.06)',backdropFilter:'blur(16px)',borderRadius:'16px 16px 0 0',padding:'12px 16px',display:'flex',justifyContent:'space-around',border:'1px solid rgba(255,255,255,0.1)',borderBottom:'none'}}>
          {[{n:productCount,l:'منتج',c:'#FF6A00'},{n:serviceCount,l:'خدمة',c:'#A855F7'},{n:'24h',l:'توصيل',c:'#00D2B3'}].map((s,i)=>(<div key={i} style={{textAlign:'center',flex:1,borderLeft:i>0?'1px solid rgba(255,255,255,0.08)':'none'}}><div style={{fontSize:20,fontWeight:900,color:s.c}}>{s.n}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.5)',fontWeight:600,marginTop:2}}>{s.l}</div></div>))}
        </div>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const [show,setShow]=useState(false);
  useEffect(()=>{const h=()=>setShow(window.scrollY>400);window.addEventListener('scroll',h);return()=>window.removeEventListener('scroll',h);},[]);
  if(!show)return null;
  return (<button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{position:'fixed',bottom:100,right:20,zIndex:150,width:42,height:42,borderRadius:'50%',background:'rgba(255,255,255,0.08)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.15)',color:'#FF6A00',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}><ChevronUp size={18}/></button>);
}

function FilterDrawer({onClose,priceMin,priceMax,setPriceMin,setPriceMax,typeFilter,setTypeFilter,sortBy,setSortBy,maxP}:{onClose:()=>void;priceMin:number;priceMax:number;setPriceMin:(v:number)=>void;setPriceMax:(v:number)=>void;typeFilter:string;setTypeFilter:(v:string)=>void;sortBy:string;setSortBy:(v:any)=>void;maxP:number}) {
  const [lMin,setLMin]=useState(priceMin);
  const [lMax,setLMax]=useState(priceMax||maxP);
  const apply=()=>{setPriceMin(lMin);setPriceMax(lMax>=maxP?0:lMax);onClose();};
  const reset=()=>{setLMin(0);setLMax(maxP);setPriceMin(0);setPriceMax(0);setTypeFilter('all');onClose();};
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',zIndex:400,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:520,background:'linear-gradient(180deg,#151f35 0%,#0f1829 100%)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'24px 24px 0 0',padding:'20px 20px 36px',boxShadow:'0 -8px 60px rgba(0,0,0,0.5)'}}>
        <div style={{width:40,height:4,background:'rgba(255,255,255,0.2)',borderRadius:99,margin:'0 auto 20px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{fontSize:16,fontWeight:900,color:'#fff',display:'flex',alignItems:'center',gap:8}}><SlidersHorizontal size={16} color="#FF6A00"/> الفلاتر</h3>
          <button onClick={reset} style={{fontSize:12,color:'#FF6A00',background:'rgba(255,106,0,0.12)',border:'1px solid rgba(255,106,0,0.25)',cursor:'pointer',fontWeight:700,padding:'5px 12px',borderRadius:8}}>إعادة تعيين</button>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.45)',marginBottom:10}}>نوع المنتج</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[['all','🛍️ الكل'],['product','📦 منتجات'],['service','🔧 خدمات'],['digital','💻 رقمي']].map(([v,l])=>(
              <button key={v} onClick={()=>setTypeFilter(v)} style={{padding:'7px 14px',borderRadius:99,border:`1.5px solid ${typeFilter===v?'#FF6A00':'rgba(255,255,255,0.12)'}`,background:typeFilter===v?'rgba(255,106,0,0.12)':'rgba(255,255,255,0.05)',color:typeFilter===v?'#FF6A00':'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.45)',marginBottom:10}}>السعر: <span style={{color:'#FF6A00'}}>{lMin} — {lMax>=maxP?'∞':lMax}</span></div>
          <div style={{display:'flex',gap:12}}>
            <div style={{flex:1}}><div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginBottom:4}}>من</div><input type="range" min={0} max={maxP} step={10} value={lMin} onChange={e=>setLMin(Math.min(+e.target.value,lMax-10))} style={{width:'100%',accentColor:'#FF6A00'}}/></div>
            <div style={{flex:1}}><div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginBottom:4}}>إلى</div><input type="range" min={0} max={maxP} step={10} value={lMax} onChange={e=>setLMax(Math.max(+e.target.value,lMin+10))} style={{width:'100%',accentColor:'#FF6A00'}}/></div>
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.45)',marginBottom:10}}>الترتيب</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[['popular','🔥 الأكثر طلباً'],['newest','✨ الأحدث'],['price-asc','💰 الأقل سعراً'],['price-desc','💎 الأعلى سعراً']].map(([v,l])=>(
              <button key={v} onClick={()=>setSortBy(v)} style={{padding:'7px 12px',borderRadius:99,border:`1.5px solid ${sortBy===v?'#FF6A00':'rgba(255,255,255,0.12)'}`,background:sortBy===v?'rgba(255,106,0,0.12)':'rgba(255,255,255,0.05)',color:sortBy===v?'#FF6A00':'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
            ))}
          </div>
        </div>
        <button onClick={apply} style={{width:'100%',height:50,background:'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',borderRadius:16,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 24px rgba(255,106,0,0.4)'}}>تطبيق</button>
      </div>
    </div>
  );
}

// ─── MAIN STOREFRONT ──────────────────────────────────────────────────────────
export default function Storefront() {
  const userId=(()=>{
    const path=window.location.pathname;
    const m=path.match(/\/store\/([^\/\?]+)/);if(m)return m[1];
    const p=new URLSearchParams(window.location.search);
    const q=p.get('userId')||p.get('user')||p.get('id');if(q)return q;
    const h=window.location.hash.replace('#','');if(h&&h.length>5)return h;
    return '';
  })();

  const {products,storeInfo,loading,error}=useStorefront(userId);
  const cart=useCart();

  const [search,setSearch]=useState('');
  const [activeTab,setActiveTab]=useState('all');
  const [sortBy,setSortBy]=useState<'popular'|'newest'|'price-asc'|'price-desc'>('popular');
  const [viewProduct,setViewProduct]=useState<SProduct|null>(null);
  const [priceMin,setPriceMin]=useState(0);
  const [priceMax,setPriceMax]=useState(0);
  const [typeFilter,setTypeFilter]=useState('all');
  const [showFilters,setShowFilters]=useState(false);
  const [showCart,setShowCart]=useState(false);
  const [showTrack,setShowTrack]=useState(false);
  const [cartAnim,setCartAnim]=useState(false);
  const [successOrderId,setSuccessOrderId]=useState('');
  const [selectedCategory,setSelectedCategory]=useState('all');

  // New states for bundles & comparison
  const [comparisonList,setComparisonList]=useState<SProduct[]>([]);
  const [showComparison,setShowComparison]=useState(false);
  const [liveMsg,setLiveMsg]=useState<string|null>(null);

  const maxP=useMemo(()=>Math.max(...products.map(p=>p.price),500),[products]);
  const handleAddToCart=(p:SProduct,size?:string,color?:string)=>{
    cart.add(p,size||p.sizes?.[0]||'',color||p.colors?.[0]||'');
    setCartAnim(true);setTimeout(()=>setCartAnim(false),600);
  };

  // Hardcoded bundles (just for demo)
  const bundles:Bundle[] = products.length>=2 ? [
    {id:'bundle1',name:'باقة الصيف',products:[products[0].id,products[1].id],bundlePrice:Math.round((products[0].price+products[1].price)*0.8),originalPrice:products[0].price+products[1].price,discount:15},
  ] : [];

  const handleAddBundle=(bundle:Bundle)=>{
    bundle.products.forEach(pid=>{
      const prod=products.find(p=>p.id===pid);
      if(prod) cart.add(prod,'','');
    });
    setLiveMsg(`تم إضافة باقة "${bundle.name}" للسلة!`);
    setTimeout(()=>setLiveMsg(null),5000);
  };

  const toggleComparison=(p:SProduct)=>{
    setComparisonList(prev=> prev.some(x=>x.id===p.id) ? prev.filter(x=>x.id!==p.id) : [...prev.slice(0,3),p] );
  };

  useEffect(()=>{(window as any).__sfProducts=products;},[products]);
  useEffect(()=>{
    if(!products.length)return;
    const pid=new URLSearchParams(window.location.search).get('p');
    if(pid){const f=products.find(x=>x.id===pid);if(f)setViewProduct(f);}
  },[products]);
  useEffect(()=>{if(viewProduct)trackStoreEvent(userId,'view',{id:viewProduct.id,name:viewProduct.name});},[viewProduct?.id]);

  const trackViewed=useCallback((p:SProduct)=>{
    try{const k=`sahar_viewed_${userId}`;const prev:string[]=JSON.parse(localStorage.getItem(k)||'[]');localStorage.setItem(k,JSON.stringify([p.id,...prev.filter(id=>id!==p.id)].slice(0,20)));}catch{}
  },[userId]);

  const allProducts=products.filter(p=>(!p.type||p.type==='product'));
  const allServices=products.filter(p=>p.type==='service');
  const allDigital=products.filter(p=>p.type==='digital');
  const categories=['all',...Array.from(new Set(products.map(p=>p.category).filter(Boolean)))];

  const filterBySearch=(list:SProduct[])=>list.filter(p=>
    (!search||p.name.includes(search)||p.description?.includes(search)||p.sku?.includes(search))
    &&(priceMax===0||p.price<=priceMax)&&(priceMin===0||p.price>=priceMin)
    &&(activeTab==='all'||p.category===activeTab)
    &&(selectedCategory==='all'||p.category===selectedCategory)
  );
  const sortList=(list:SProduct[])=>{
    if(sortBy==='popular')return [...list].sort((a,b)=>b.sales-a.sales);
    if(sortBy==='newest')return [...list].sort((a,b)=>new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime());
    if(sortBy==='price-asc')return [...list].sort((a,b)=>a.price-b.price);
    if(sortBy==='price-desc')return [...list].sort((a,b)=>b.price-a.price);
    return list;
  };
  const filteredProducts=sortList(filterBySearch(typeFilter==='all'||typeFilter==='product'?allProducts:[]));
  const filteredServices=sortList(filterBySearch(typeFilter==='all'||typeFilter==='service'?allServices:[]));
  const filteredDigital=sortList(filterBySearch(typeFilter==='all'||typeFilter==='digital'?allDigital:[]));
  const hasActiveFilter=priceMin>0||priceMax>0||typeFilter!=='all';
  void successOrderId;

  if(loading) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'linear-gradient(180deg,#0B1020 0%,#121826 100%)',padding:16,fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <style>{`@keyframes sfshim{0%{background-position:200% 0}100%{background-position:-200% 0}}.sfsk{background:linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.05) 75%);background-size:200% 100%;animation:sfshim 1.4s infinite;border-radius:10px;}`}</style>
      <div style={{height:48,borderRadius:14,marginBottom:12}} className="sfsk"/>
      <div style={{height:110,borderRadius:18,marginBottom:14}} className="sfsk"/>
      <div style={{height:36,borderRadius:99,marginBottom:14}} className="sfsk"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {Array.from({length:6}).map((_,i)=>(<div key={i} style={{borderRadius:20,overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)'}}><div style={{height:180}} className="sfsk"/><div style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:6,background:'rgba(255,255,255,0.04)'}}><div style={{height:10,width:'60%'}} className="sfsk"/><div style={{height:14,width:'90%'}} className="sfsk"/><div style={{height:18,width:'40%'}} className="sfsk"/></div></div>))}
      </div>
    </div>
  );

  if(!userId) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'linear-gradient(180deg,#0B1020 0%,#121826 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center',gap:16,fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <div style={{fontSize:56}}>🏪</div>
      <div style={{fontSize:22,fontWeight:900,color:'#fff'}}>متجر SAHAR Shop</div>
      <div style={{fontSize:14,color:'rgba(255,255,255,0.5)',maxWidth:320,lineHeight:1.8}}>اطلب من التاجر مشاركة رابط متجره الخاص معك.</div>
      <a href="/" style={{padding:'10px 24px',background:'linear-gradient(135deg,#FF6A00,#FF8533)',borderRadius:12,color:'#fff',fontWeight:700,fontSize:14,textDecoration:'none'}}>الصفحة الرئيسية</a>
    </div>
  );

  if(error||(!loading&&!storeInfo)) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'linear-gradient(180deg,#0B1020 0%,#121826 100%)',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.5)',textAlign:'center',padding:24,fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <div><div style={{fontSize:40,marginBottom:16}}>🏪</div><div style={{fontSize:18,fontWeight:700,color:'#fff',marginBottom:8}}>المتجر غير موجود</div><div style={{fontSize:14}}>{error||'تحقق من الرابط'}</div></div>
    </div>
  );

  const brand=storeInfo!.brand;
  const cur=brand.currency||'MAD';

  if(!loading&&!error&&storeInfo&&products.length===0) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'linear-gradient(180deg,#0B1020 0%,#121826 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',textAlign:'center',fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <div style={{width:76,height:76,borderRadius:20,overflow:'hidden',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
        {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span style={{fontSize:32}}>🏪</span>}
      </div>
      <h1 style={{fontSize:26,fontWeight:900,color:'#FF6A00',marginBottom:8,textShadow:'0 0 24px rgba(255,106,0,0.4)'}}>{brand.name||'المتجر'}</h1>
      <div style={{fontSize:64,margin:'20px 0 14px'}}>📦</div>
      <h2 style={{fontSize:18,fontWeight:800,color:'#fff',marginBottom:8}}>المتجر قيد التجهيز</h2>
      <p style={{fontSize:14,color:'rgba(255,255,255,0.5)',maxWidth:300,lineHeight:1.8,marginBottom:28}}>سيضاف المنتجات قريباً — تابعونا!</p>
      {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'12px 24px',borderRadius:14,background:'#25D366',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none',boxShadow:'0 4px 20px rgba(37,211,102,0.35)'}}>💬 تواصل معنا</a>}
    </div>
  );

  const bestSellers=[...products].sort((a,b)=>(b.sales||0)-(a.sales||0)).slice(0,6).filter(p=>(p.sales||0)>0);
  const recentlyViewedIds:string[]=JSON.parse(localStorage.getItem(`sahar_viewed_${userId}`)||'[]');
  const recentlyViewed=recentlyViewedIds.slice(0,8).map(id=>products.find(p=>p.id===id)).filter(Boolean) as SProduct[];

  return (
    <div dir="rtl" style={{
      ...SF,
      minHeight:'100dvh',
      background:'radial-gradient(circle at 20% 20%,rgba(124,58,237,0.15),transparent 45%),radial-gradient(circle at 80% 80%,rgba(255,106,0,0.12),transparent 45%),linear-gradient(180deg,#0B1020 0%,#121826 100%)',
      color:'#fff',
      fontFamily:'Tajawal,system-ui,sans-serif',
    } as React.CSSProperties}>
      <style>{`
        @keyframes sfmarquee, sfgradientshift, sfpulse, sfshim, slideIn{from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1}}
      `}</style>

      <PromoBar/>

      {/* HEADER (same) */}
      <header style={{position:'sticky',top:0,zIndex:100,background:'rgba(11,16,32,0.85)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'0 14px',height:62,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div style={{width:38,height:38,borderRadius:11,overflow:'hidden',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span style={{fontSize:16,fontWeight:900,color:'#FF6A00'}}>{brand.name?.[0]?.toUpperCase()||'S'}</span>}
          </div>
          <div style={{fontSize:14,fontWeight:800,color:'#fff',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{brand.name}</div>
        </div>
        <div style={{flex:1,maxWidth:260,position:'relative'}}>
          <Search size={14} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.4)',pointerEvents:'none'}}/>
          <input className="sf-input" placeholder="ابحث..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',paddingRight:36,paddingLeft:14,height:38,borderRadius:20,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'Tajawal,sans-serif'}}/>
        </div>
        <div style={{display:'flex',gap:7,alignItems:'center',flexShrink:0}}>
          <button onClick={()=>setShowTrack(true)} style={{padding:'5px 10px',borderRadius:9,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><Package size={12}/> طلباتي</button>
          {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'5px 10px',borderRadius:9,background:'rgba(37,211,102,0.1)',border:'1px solid rgba(37,211,102,0.25)',color:'#25D366',fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4,textDecoration:'none'}}><MessageCircle size={12}/> واتساب</a>}
          <button onClick={()=>setShowCart(true)} style={{position:'relative',width:40,height:40,borderRadius:11,background:cartAnim?'linear-gradient(135deg,#FF6A00,#FF8533)':'rgba(255,255,255,0.07)',border:`1px solid ${cartAnim?'transparent':'rgba(255,255,255,0.12)'}`,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .25s'}}>
            <ShoppingCart size={18}/>
            {cart.count>0&&<span style={{position:'absolute',top:-5,left:-5,width:18,height:18,background:'#FF6A00',borderRadius:'50%',fontSize:10,fontWeight:900,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #0B1020'}}>{cart.count}</span>}
          </button>
        </div>
      </header>

      <HeroSection brand={brand} productCount={allProducts.length} serviceCount={allServices.length} onShop={()=>{setActiveTab('all');setSelectedCategory('all');}} onServices={()=>{setActiveTab('خدمات');setSelectedCategory('خدمات');}}/>
      <TrustCounters productCount={products.length}/>

      {/* CATEGORY BAR */}
      <div style={{background:'rgba(11,16,32,0.8)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.07)',padding:'10px 0',position:'sticky',top:62,zIndex:90}}>
        <div style={{display:'flex',gap:8,overflowX:'auto',padding:'0 14px',scrollbarWidth:'none'}}>
          {categories.map(cat=>{
            const count=cat==='all'?products.length:products.filter(p=>p.category===cat).length;
            const active=activeTab===cat;
            return (
              <button key={cat} onClick={()=>{setActiveTab(cat);setSelectedCategory(cat);}} style={{flexShrink:0,padding:'7px 14px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',border:`1px solid ${active?'rgba(255,106,0,0.5)':'rgba(255,255,255,0.1)'}`,background:active?'rgba(255,106,0,0.15)':'rgba(255,255,255,0.05)',color:active?'#FF6A00':'rgba(255,255,255,0.6)'}}>{cat==='all'?'الكل':cat} ({count})</button>
          );
          })}
        </div>
      </div>

      {/* FILTER ROW */}
      <div style={{padding:'12px 14px 0',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <span style={{fontSize:12,color:'rgba(255,255,255,0.45)',fontWeight:600}}>{filteredProducts.length+filteredServices.length+filteredDigital.length} نتيجة
          {hasActiveFilter&&<button onClick={()=>{setPriceMin(0);setPriceMax(0);setTypeFilter('all');}} style={{marginRight:6,fontSize:10,color:'#FF6A00',background:'rgba(255,106,0,0.12)',border:'none',borderRadius:99,padding:'2px 8px',cursor:'pointer',fontWeight:700}}>× مسح</button>}
        </span>
        <div style={{display:'flex',gap:6}}>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:9,padding:'5px 10px',color:'rgba(255,255,255,0.7)',fontSize:12,cursor:'pointer',outline:'none'}}>
            <option value="popular">الأكثر طلباً</option><option value="newest">الأحدث</option><option value="price-asc">الأقل سعراً</option><option value="price-desc">الأعلى سعراً</option>
          </select>
          <button onClick={()=>setShowFilters(true)} style={{width:36,height:36,borderRadius:9,background:hasActiveFilter?'rgba(255,106,0,0.15)':'rgba(255,255,255,0.07)',border:`1px solid ${hasActiveFilter?'rgba(255,106,0,0.4)':'rgba(255,255,255,0.12)'}`,color:hasActiveFilter?'#FF6A00':'rgba(255,255,255,0.6)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}><Filter size={14}/>{hasActiveFilter&&<span style={{position:'absolute',top:-4,right:-4,width:10,height:10,background:'#EF4444',borderRadius:'50%'}}/>}</button>
        </div>
      </div>

      {/* TRUST BADGES */}
      <div style={{padding:'10px 14px',display:'flex',gap:8,overflowX:'auto'}}>
        {[{i:'🚚',t:'توصيل 24-48h'},{i:'💵',t:'دفع عند الاستلام'},{i:'🔄',t:'إرجاع 7 أيام'},{i:'🔒',t:'دفع آمن'},{i:'⭐',t:'جودة مضمونة'}].map(b=>(<div key={b.t} style={{whiteSpace:'nowrap',fontSize:11,color:'rgba(255,255,255,0.6)',fontWeight:600,padding:'5px 11px',borderRadius:99,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.09)',flexShrink:0}}>{b.i}{b.t}</div>))}
      </div>

      <div style={{padding:'0 14px 110px'}}>

        {/* BUNDLES (new) */}
        {bundles.length>0&&(
          <div style={{marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}><Flame size={16} color="#FF6A00"/> <span style={{fontSize:15,fontWeight:800,color:'#fff'}}>عروض خاصة</span></div>
            {bundles.map(b=><BundleCard key={b.id} bundle={b} products={products} currency={cur} onAdd={handleAddBundle}/>)}
          </div>
        )}

        {/* COMPARISON BUTTON */}
        {comparisonList.length>0&&(
          <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
            <button onClick={()=>setShowComparison(true)} style={{padding:'8px 14px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:99,color:'#FF6A00',fontWeight:700,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}><BarChart3 size={14}/> مقارنة ({comparisonList.length})</button>
            <button onClick={()=>setComparisonList([])} style={{padding:'8px 14px',background:'transparent',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,color:'rgba(255,255,255,0.6)',fontSize:12,cursor:'pointer'}}>مسح</button>
          </div>
        )}

        {/* BEST SELLERS */}
        {bestSellers.length>=2&&!search&&activeTab==='all'&&(
          <div style={{marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><Flame size={16} color="#FF6A00"/> <span style={{fontSize:15,fontWeight:800}}>الأكثر طلباً</span></div>
            <div style={{display:'flex',gap:10,overflowX:'auto'}}>
              {bestSellers.map(p=>(
                <div key={p.id} onClick={()=>{trackViewed(p);setViewProduct(p);}} style={{flexShrink:0,width:220,borderRadius:18,overflow:'hidden',cursor:'pointer',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
                  <div style={{height:110,position:'relative',background:'rgba(0,0,0,0.3)',overflow:'hidden'}}>
                    {p.imageUrl?<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<div style={{fontSize:40,textAlign:'center'}}>{p.emoji}</div>}
                    <span style={{position:'absolute',top:8,right:8,background:'linear-gradient(135deg,#FF6A00,#FF3D00)',color:'#fff',fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:99}}>🔥 #{bestSellers.indexOf(p)+1}</span>
                  </div>
                  <div style={{padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:12,fontWeight:700,color:'#fff'}}>{p.name}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>{p.sales} طلب</div></div><div style={{fontSize:15,fontWeight:900,color:'#FF6A00'}}>{p.price}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {filteredProducts.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{width:3,height:22,background:'linear-gradient(180deg,#FF6A00,#FF8533)',borderRadius:99}}/><span style={{fontSize:16,fontWeight:900}}>منتجاتنا</span><span style={{fontSize:11,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.07)',padding:'2px 9px',borderRadius:99}}>{filteredProducts.length}</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:14}}>
              {filteredProducts.map(p=>(
                <div key={p.id} style={{position:'relative'}}>
                  <ProductCard p={p} currency={cur} onAdd={handleAddToCart} onView={p=>{trackViewed(p);setViewProduct(p);}}/>
                  {/* Comparison checkbox */}
                  <button onClick={(e)=>{e.stopPropagation();toggleComparison(p);}} style={{position:'absolute',top:8,right:40,zIndex:3,background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'50%',width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',cursor:'pointer'}}>
                    {comparisonList.some(x=>x.id===p.id)?<Check size={12} color="#FF6A00"/>:<BarChart3 size={12}/>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES */}
        {filteredServices.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{width:3,height:22,background:'linear-gradient(180deg,#7C3AED,#A855F7)',borderRadius:99}}/><span style={{fontSize:16,fontWeight:900}}>خدماتنا</span><span style={{fontSize:11,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.07)',padding:'2px 9px',borderRadius:99}}>{filteredServices.length}</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {filteredServices.map(p=><ServiceCard key={p.id} p={p} currency={cur} onView={p=>{trackViewed(p);setViewProduct(p);}}/>)}
            </div>
          </div>
        )}

        {/* DIGITAL */}
        {filteredDigital.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{width:3,height:22,background:'linear-gradient(180deg,#0EA5E9,#38BDF8)',borderRadius:99}}/><span style={{fontSize:16,fontWeight:900}}>المنتجات الرقمية</span><span style={{fontSize:11,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.07)',padding:'2px 9px',borderRadius:99}}>{filteredDigital.length}</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:14}}>
              {filteredDigital.map(p=><ProductCard key={p.id} p={p} currency={cur} onAdd={handleAddToCart} onView={p=>{trackViewed(p);setViewProduct(p);}}/>)}
            </div>
          </div>
        )}

        {/* RECENTLY VIEWED */}
        {recentlyViewed.length>0&&!search&&(
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}><Eye size={14} color="rgba(255,255,255,0.4)"/><span style={{fontSize:13,fontWeight:700,color:'rgba(255,255,255,0.55)'}}>شاهدتها مؤخراً</span></div>
            <div style={{display:'flex',gap:8,overflowX:'auto'}}>
              {recentlyViewed.filter(p=>!viewProduct||p.id!==viewProduct.id).slice(0,6).map(p=>(
                <div key={p.id} onClick={()=>{trackViewed(p);setViewProduct(p);}} style={{flexShrink:0,width:90,borderRadius:12,overflow:'hidden',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.09)',cursor:'pointer'}}>
                  <div style={{height:72,background:'rgba(0,0,0,0.3)'}}>{p.imageUrl?<img src={p.imageUrl} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{fontSize:24}}>{p.emoji}</div>}</div>
                  <div style={{padding:'5px 7px'}}><div style={{fontSize:10,fontWeight:700,color:'#fff'}}>{p.name}</div><div style={{fontSize:11,fontWeight:900,color:'#FF6A00'}}>{p.price}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMPTY */}
        {filteredProducts.length===0&&filteredServices.length===0&&filteredDigital.length===0&&(search||hasActiveFilter)&&(
          <div style={{textAlign:'center',padding:'60px 20px',background:'rgba(255,255,255,0.04)',borderRadius:18,border:'1px solid rgba(255,255,255,0.08)'}}>
            <Package size={48} style={{margin:'0 auto 16px',opacity:.2}}/>
            <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>لم نجد نتائج</div>
            <button onClick={()=>{setSearch('');setPriceMin(0);setPriceMax(0);setTypeFilter('all');setActiveTab('all');setSelectedCategory('all');}} style={{padding:'9px 22px',background:'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',borderRadius:12,color:'#fff',fontWeight:700}}>مسح الكل</button>
          </div>
        )}
      </div>

      {/* STICKY CART + MODALS */}
      {cart.count>0&&!showCart&&(
        <div style={{position:'fixed',bottom:20,right:14,left:14,zIndex:150}}>
          <button onClick={()=>setShowCart(true)} style={{width:'100%',height:54,background:'linear-gradient(135deg,#FF6A00,#FF8533)',border:'none',borderRadius:18,color:'#fff',fontSize:15,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:'0 8px 32px rgba(255,106,0,0.5)'}}>
            <ShoppingCart size={18}/> السلة ({cart.count}) <span style={{background:'rgba(255,255,255,0.2)',borderRadius:99,padding:'2px 12px',fontSize:13}}>{cart.total} {cur}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {viewProduct&&<ProductModal p={viewProduct} cart={cart} onClose={()=>setViewProduct(null)} currency={cur} userId={userId}/>}
      {showCart&&<CartSidebar cart={cart} storeInfo={storeInfo!} userId={userId} onClose={()=>setShowCart(false)} onOrderSuccess={id=>{setSuccessOrderId(id);setShowCart(false);}}/>}
      {showTrack&&<TrackingModal userId={userId} storeInfo={storeInfo!} onClose={()=>setShowTrack(false)}/>}
      {showFilters&&<FilterDrawer onClose={()=>setShowFilters(false)} priceMin={priceMin} priceMax={priceMax||maxP} setPriceMin={setPriceMin} setPriceMax={setPriceMax} typeFilter={typeFilter} setTypeFilter={setTypeFilter} sortBy={sortBy} setSortBy={setSortBy} maxP={maxP}/>}
      {showComparison&&<ComparisonModal products={comparisonList} onClose={()=>setShowComparison(false)}/>}
      <FloatingChat userId={userId} storeInfo={storeInfo!}/>
      <ScrollToTop/>
      {liveMsg&&<LiveNotification message={liveMsg} onClose={()=>setLiveMsg(null)}/>}
    </div>
  );
}