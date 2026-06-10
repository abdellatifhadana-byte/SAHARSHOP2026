import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, ShoppingCart, X, MessageCircle, Share2, Plus, Minus, Check,
  Package, Heart, Send, Bot, ArrowRight, Play, Pause,
  Flame, ChevronUp, Clock, MapPin, Filter, SlidersHorizontal, Eye,
  Camera, Gift, Users, Sparkles, Star,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════ TYPES
interface CustomField { id:string; label:string; type:string; options:string[]; value:string; }
interface SProduct {
  id:string; name:string; description:string; price:number; cost?:number;
  stock:number; category:string; sizes:string[]; colors:string[];
  status:string; emoji:string; imageUrl:string; images:string[]; videoUrl?:string; sku?:string;
  sales:number; views?:number; colorImages?:Record<string,string>; createdAt?:string;
  type?:'product'|'service'|'digital'; duration?:string; workArea?:string; portfolio?:string[];
  customFields?:CustomField[];
}
interface CartItem {
  product:SProduct; quantity:number; size:string; color:string;
  giftWrap?:boolean; giftMessage?:string;
}
interface StoreInfo {
  brand:{name:string;phone:string;currency:string;logo?:string;description?:string;
         instagram?:string;facebook?:string;whatsapp?:string;email?:string;
         workStart?:string;workEnd?:string;address?:string};
  deliveryCosts?:Record<string,number>;
}
interface ChatMsg { role:'user'|'ai'; content:string; product?:SProduct; }

// ═══════════════════════════════════════════════════════════════ CONSTANTS
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

function minDeliveryCost(costs?:Record<string,number>):number {
  const all={ ...DEFAULT_COSTS, ...(costs||{}) };
  const vals=Object.entries(all).filter(([k])=>k!=='default').map(([,v])=>v).filter(v=>v>0);
  return vals.length?Math.min(...vals):0;
}

function storeOpenStatus(workStart?:string,workEnd?:string):{open:boolean;label:string}|null {
  if(!workStart||!workEnd) return null;
  const now=new Date();const cur=now.getHours()*60+now.getMinutes();
  const [sh,sm]=workStart.split(':').map(Number);const [eh,em]=workEnd.split(':').map(Number);
  if(isNaN(sh)||isNaN(eh)) return null;
  const start=sh*60+(sm||0);const end=eh*60+(em||0);
  const open=cur>=start&&cur<=end;
  return {open,label:open?`مفتوح الآن · حتى ${workEnd}`:`مغلق · يفتح ${workStart}`};
}

// ═══════════════════════════════════════════════════════════════ ANALYTICS
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

// ═══════════════════════════════════════════════════════════════ HOOKS
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
  
  const add=(product:SProduct,size:string,color:string,giftWrap?:boolean,giftMessage?:string)=>setItems(prev=>{
    const ex=prev.find(i=>i.product.id===product.id&&i.size===size&&i.color===color);
    if(ex) return prev.map(i=>i===ex?{...i,quantity:i.quantity+1}:i);
    return [...prev,{product,quantity:1,size,color,giftWrap,giftMessage}];
  });
  
  const remove=(pid:string,size:string,color:string)=>setItems(p=>p.filter(i=>!(i.product.id===pid&&i.size===size&&i.color===color)));
  
  const update=(pid:string,size:string,color:string,qty:number)=>setItems(p=>qty<=0?p.filter(i=>!(i.product.id===pid&&i.size===size&&i.color===color)):p.map(i=>(i.product.id===pid&&i.size===size&&i.color===color)?{...i,quantity:qty}:i));
  
  const toggleGift=(pid:string,size:string,color:string)=>setItems(p=>p.map(i=>(i.product.id===pid&&i.size===size&&i.color===color)?{...i,giftWrap:!i.giftWrap}:i));
  
  const setGiftMsg=(pid:string,size:string,color:string,msg:string)=>setItems(p=>p.map(i=>(i.product.id===pid&&i.size===size&&i.color===color)?{...i,giftMessage:msg}:i));
  
  const total=items.reduce((s,i)=>s+i.product.price*i.quantity+(i.giftWrap?15:0),0);
  const count=items.reduce((s,i)=>s+i.quantity,0);
  const clear=()=>setItems([]);
  
  return {items,add,remove,update,total,count,clear,toggleGift,setGiftMsg};
}

// ═══════════════════════════════════════════════════════════════ UTILS
function isNightTime():boolean {
  const h=new Date().getHours();
  return h>=19||h<6;
}

// ═══════════════════════════════════════════════════════════════ SKELETON
function PageSkeleton() {
  return (
    <div style={{minHeight:'100dvh',background:'#0A0A0A',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,gap:24}}>
      <div style={{fontSize:48,animation:'sfFadeIn .6s ease',opacity:0.3,color:'#fff'}}>✦</div>
      <div style={{width:180,height:14,borderRadius:99,background:'rgba(255,255,255,0.08)',animation:'sfPulse 1.5s ease infinite'}}/>
      <div style={{width:120,height:10,borderRadius:99,background:'rgba(255,255,255,0.05)',animation:'sfPulse 1.5s ease .3s infinite'}}/>
      <style>{`
        @keyframes sfFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sfPulse{0%,100%{opacity:.5}50%{opacity:1}}
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ LIVE TICKER
function LiveTicker({orders}:{orders:{name:string;city:string;product:string;time:string}[]}) {
  if(!orders.length) return null;
  return (
    <div style={{position:'fixed',bottom:100,left:16,right:16,zIndex:180,pointerEvents:'none',display:'flex',justifyContent:'center'}}>
      <div style={{background:'rgba(10,10,10,0.92)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:99,padding:'8px 18px',color:'#fff',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:8,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',animation:'sfSlideUp .4s ease, sfFadeOut .4s ease 4.6s forwards',maxWidth:'90%',overflow:'hidden',whiteSpace:'nowrap'}}>
        <span style={{width:7,height:7,borderRadius:'50%',background:'#22C55E',flexShrink:0,animation:'sfLivePulse 1.5s ease infinite'}}/>
        <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>
          <strong>{orders[0].name}</strong> من {orders[0].city} {orders[0].product} قبل {orders[0].time}
        </span>
      </div>
      <style>{`
        @keyframes sfSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sfFadeOut{to{opacity:0;transform:translateY(-8px)}}
        @keyframes sfLivePulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)}50%{box-shadow:0 0 0 6px rgba(34,197,94,0)}}
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ PRODUCT CARD
function ProductCard({p,onAdd,onView,currency,isNight}:{p:SProduct;onAdd:(p:SProduct)=>void;onView:(p:SProduct)=>void;currency:string;isNight:boolean}) {
  const [hover,setHover]=useState(false);
  const [imgIdx,setImgIdx]=useState(0);
  const [liked,setLiked]=useState(()=>{try{return JSON.parse(localStorage.getItem('sahar_wishlist')||'[]').includes(p.id);}catch{return false;}});
  const imgs=[p.imageUrl,...(p.images||[])].filter(Boolean);
  const isNew=p.createdAt&&(Date.now()-new Date(p.createdAt).getTime()<7*24*60*60*1000);
  const discount=p.cost&&p.cost>p.price?Math.round((1-p.price/p.cost)*100):0;
  const rating=p.sales>20?5:p.sales>10?4:p.sales>3?4:3;

  const toggleLike=(e:React.MouseEvent)=>{
    e.stopPropagation();
    const wl:string[]=JSON.parse(localStorage.getItem('sahar_wishlist')||'[]');
    localStorage.setItem('sahar_wishlist',JSON.stringify(liked?wl.filter(x=>x!==p.id):[...wl,p.id]));
    setLiked(!liked);
  };

  return (
    <div onClick={()=>onView(p)}
      onMouseEnter={()=>{setHover(true);if(imgs.length>1)setImgIdx(1);}}
      onMouseLeave={()=>{setHover(false);setImgIdx(0);}}
      style={{cursor:'pointer',position:'relative',transition:'transform .3s cubic-bezier(.25,.1,.25,1)',transform:hover?'scale(1.02)':'scale(1)'}}>
      {/* Image */}
      <div style={{aspectRatio:'3/4',overflow:'hidden',borderRadius:4,background:'#1A1A1A',position:'relative'}}>
        {imgs.length>0
          ?<img src={imgs[imgIdx]} alt={p.name} loading="lazy"
              style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .5s cubic-bezier(.25,.1,.25,1)',transform:hover?'scale(1.06)':'scale(1)'}}/>
          :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,color:'rgba(255,255,255,0.1)'}}>{p.emoji||'📦'}</div>
        }
        {/* Overlay on hover */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)',opacity:hover?1:0,transition:'opacity .3s',display:'flex',alignItems:'flex-end',padding:14}}>
          <button onClick={e=>{e.stopPropagation();onAdd(p);}}
            style={{width:'100%',padding:'11px',borderRadius:99,background:'#fff',border:'none',color:'#0A0A0A',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
            <ShoppingCart size={15}/> أضف للسلة
          </button>
        </div>
        {/* Badges */}
        <div style={{position:'absolute',top:10,left:10,display:'flex',gap:5,flexWrap:'wrap'}}>
          {isNew&&<span style={{background:'#fff',color:'#0A0A0A',fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:99}}>جديد</span>}
          {discount>0&&<span style={{background:'#EF4444',color:'#fff',fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:99}}>-{discount}%</span>}
          {p.stock<=3&&p.stock>0&&<span style={{background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',color:'#fff',fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:99}}>آخر {p.stock}</span>}
          {p.stock===0&&<span style={{background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',color:'#fff',fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:99}}>نفذ</span>}
        </div>
        {/* Like button */}
        <button onClick={toggleLike} style={{position:'absolute',top:10,right:10,width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,0.4)',backdropFilter:'blur(8px)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>
          <Heart size={14} fill={liked?'#EF4444':'none'} color={liked?'#EF4444':'#fff'}/>
        </button>
        {/* Image dots */}
        {imgs.length>1&&(
          <div style={{position:'absolute',bottom:10,right:10,display:'flex',gap:3}}>
            {imgs.map((_,i)=><div key={i} style={{width:4,height:4,borderRadius:'50%',background:i===imgIdx?'#fff':'rgba(255,255,255,0.4)',transition:'background .3s'}}/>)}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{padding:'10px 0'}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:600,letterSpacing:'.06em',marginBottom:3,textTransform:'uppercase'}}>{p.category||'—'}</div>
        <div style={{fontSize:13,fontWeight:600,color:'#fff',marginBottom:4,lineHeight:1.3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical'}}>{p.name}</div>
        {p.sales>0&&(
          <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:4}}>
            <div style={{display:'flex',gap:1}}>
              {Array.from({length:5},(_,i)=><Star key={i} size={8} fill={i<rating?'#F59E0B':'none'} color={i<rating?'#F59E0B':'rgba(255,255,255,0.2)'}/>)}
            </div>
            <span style={{fontSize:9,color:'rgba(255,255,255,0.3)'}}>{p.sales}</span>
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16,fontWeight:700,color:'#fff'}}>{p.price.toLocaleString()} <span style={{fontSize:10,fontWeight:400,color:'rgba(255,255,255,0.4)'}}>{currency}</span></span>
          {p.cost&&p.cost>p.price&&<span style={{fontSize:12,color:'rgba(255,255,255,0.4)',textDecoration:'line-through'}}>{p.cost.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ SERVICE CARD
function ServiceCard({p,onView,currency,isNight}:{p:SProduct;onView:(p:SProduct)=>void;currency:string;isNight:boolean}) {
  const [hover,setHover]=useState(false);
  const SERVICE_ICONS:Record<string,JSX.Element> = {
    'تصوير':<Camera size={20}/>,
    'تصميم':<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
    'تنظيف':<Sparkles size={20}/>,
    'إصلاح':<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/></svg>,
    'توصيل':<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  };

  const getIcon = () => {
    for (const [k, icon] of Object.entries(SERVICE_ICONS)) {
      if (p.name.includes(k) || p.category?.includes(k)) return icon;
    }
    return <Clock size={20}/>;
  };

  return (
    <div onClick={()=>onView(p)}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{flexShrink:0,width:280,cursor:'pointer',background:hover?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.03)',border:`1px solid ${hover?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.08)'}`,borderRadius:8,padding:20,transition:'all .3s cubic-bezier(.25,.1,.25,1)',transform:hover?'translateY(-2px)':'none'}}>
      <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:14,color:'#fff'}}>
        {getIcon()}
      </div>
      <div style={{fontSize:15,fontWeight:700,color:'#fff',marginBottom:4}}>{p.name}</div>
      {p.description&&<div style={{fontSize:11,color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:12,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.description}</div>}
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
        {p.duration&&<span style={{fontSize:10,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.06)',padding:'3px 8px',borderRadius:99,display:'flex',alignItems:'center',gap:4}}><Clock size={9}/> {p.duration}</span>}
        {p.workArea&&<span style={{fontSize:10,color:'rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.06)',padding:'3px 8px',borderRadius:99,display:'flex',alignItems:'center',gap:4}}><MapPin size={9}/> {p.workArea}</span>}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <span style={{fontSize:18,fontWeight:700,color:'#fff'}}>{p.price.toLocaleString()}</span>
          <span style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginRight:4}}>{currency}</span>
        </div>
        <span style={{fontSize:11,color:'#fff',background:'rgba(255,255,255,0.1)',padding:'5px 14px',borderRadius:99,fontWeight:500}}>احجز</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ LIGHTBOX
function Lightbox({images,startIndex,onClose}:{images:string[];startIndex:number;onClose:()=>void}) {
  const [idx,setIdx]=useState(startIndex);
  const [zoom,setZoom]=useState(1);
  const touch=useRef<{x:number;y:number;t:number;dist:number;baseZoom:number}|null>(null);
  const go=useCallback((d:number)=>{setIdx(i=>Math.max(0,Math.min(images.length-1,i+d)));setZoom(1);},[images.length]);
  
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
  };
  
  const onTouchEnd=(e:React.TouchEvent)=>{
    const tc=touch.current;touch.current=null;
    if(!tc||zoom>1)return;
    const dx=(e.changedTouches[0]?.clientX??tc.x)-tc.x;
    if(Math.abs(dx)>50&&Date.now()-tc.t<600)go(dx>0?-1:1);
  };
  
  return (
    <div style={{position:'fixed',inset:0,zIndex:600,background:'#000',display:'flex',alignItems:'center',justifyContent:'center',touchAction:'none'}} onClick={onClose}>
      <button onClick={onClose} style={{position:'absolute',top:16,left:16,width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3}}><X size={20}/></button>
      <div style={{position:'absolute',top:22,right:20,color:'rgba(255,255,255,.5)',fontSize:13,fontWeight:500,zIndex:3}}>{idx+1}/{images.length}</div>
      <div onClick={e=>{e.stopPropagation();setZoom(z=>z>1?1:2);}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        <img src={images[idx]} alt="" draggable={false} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',transform:`scale(${zoom})`,transition:touch.current?'none':'transform .2s',cursor:zoom>1?'grab':'zoom-in',userSelect:'none'}}/>
      </div>
      {images.length>1&&<>
        <button onClick={e=>{e.stopPropagation();go(1);}} disabled={idx>=images.length-1} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'none',color:'#fff',cursor:'pointer',fontSize:22,zIndex:3,opacity:idx>=images.length-1?.3:1}}>‹</button>
        <button onClick={e=>{e.stopPropagation();go(-1);}} disabled={idx<=0} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,.1)',border:'none',color:'#fff',cursor:'pointer',fontSize:22,zIndex:3,opacity:idx<=0?.3:1}}>›</button>
      </>}
      {images.length>1&&(
        <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:16,left:0,right:0,display:'flex',gap:6,justifyContent:'center',overflowX:'auto',padding:'0 16px',zIndex:3}}>
          {images.map((img,i)=>(
            <button key={i} onClick={()=>{setIdx(i);setZoom(1);}} style={{flexShrink:0,width:44,height:44,borderRadius:4,overflow:'hidden',border:`2px solid ${i===idx?'#fff':'rgba(255,255,255,.2)'}`,padding:0,cursor:'pointer',background:'#000'}}>
              <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ PRODUCT MODAL
function ProductModal({p,cart,onClose,currency,userId,isNight}:{p:SProduct;cart:ReturnType<typeof useCart>;onClose:()=>void;currency:string;userId:string;isNight:boolean}) {
  const [size,setSize]=useState(p.sizes?.[0]||'');
  const [color,setColor]=useState(p.colors?.[0]||'');
  const [qty,setQty]=useState(1);
  const [added,setAdded]=useState(false);
  const [giftWrap,setGiftWrap]=useState(false);
  const [giftMsg,setGiftMsgLocal]=useState('');
  const [lightboxIdx,setLightboxIdx]=useState<number|null>(null);
  const [variantRows,setVariantRows]=useState<{size:string;color:string;qty:number}[]>([{size:p.sizes?.[0]||'',color:p.colors?.[0]||'',qty:1}]);
  const firstColorImg=p.colors?.[0]&&p.colorImages?.[p.colors[0]];
  const [activeImage,setActiveImage]=useState(firstColorImg||p.imageUrl||'');
  const galleryImgs=[p.imageUrl,...(p.images||[])].filter((x,i,a)=>x&&a.indexOf(x)===i);
  const rating=p.sales>20?5:p.sales>10?4:p.sales>3?4:3;
  void userId;

  const handleAddAll=()=>{
    variantRows.forEach(row=>{
      cart.add(p,row.size,row.color,giftWrap,giftMsg);
      for(let i=1;i<row.qty;i++)cart.add(p,row.size,row.color,giftWrap,giftMsg);
    });
    setAdded(true);
    setTimeout(()=>{setAdded(false);onClose();},900);
  };
  
  const share=()=>{
    const url=window.location.origin+window.location.pathname+'?p='+p.id;
    navigator.share?.({title:p.name,url}).catch(()=>{})||navigator.clipboard?.writeText(url);
  };

  return (<>
    {lightboxIdx!==null&&galleryImgs.length>0&&<Lightbox images={galleryImgs} startIndex={lightboxIdx} onClose={()=>setLightboxIdx(null)}/>}
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',backdropFilter:'blur(8px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#111',borderRadius:'16px 16px 0 0',width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 -16px 48px rgba(0,0,0,0.5)',color:'#fff'}}>
        {/* Image */}
        <div style={{aspectRatio:'4/3',maxHeight:380,position:'relative',background:'#1A1A1A',overflow:'hidden'}}>
          {activeImage
            ?<img src={activeImage} alt={p.name} onClick={()=>{const i=galleryImgs.indexOf(activeImage);setLightboxIdx(i>=0?i:0);}}
                style={{width:'100%',height:'100%',objectFit:'cover',cursor:'zoom-in'}}/>
            :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,color:'rgba(255,255,255,0.1)'}}>{p.emoji||'📦'}</div>
          }
          <button onClick={onClose} style={{position:'absolute',top:14,left:14,width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.6)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}><X size={18}/></button>
          <button onClick={share} style={{position:'absolute',top:14,right:14,width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.6)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}><Share2 size={16}/></button>
          {p.sales>0&&<div style={{position:'absolute',bottom:12,right:12,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',color:'#fff',fontSize:11,fontWeight:500,padding:'4px 10px',borderRadius:99}}>{p.sales} مبيع</div>}
        </div>

        {/* Thumbnails */}
        {(galleryImgs.length>1||p.videoUrl)&&(
          <div style={{display:'flex',gap:6,overflowX:'auto',padding:'10px 16px',background:'#0A0A0A',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
            {galleryImgs.map((img,i)=>(
              <button key={i} onClick={()=>setActiveImage(img)} style={{flexShrink:0,width:52,height:52,borderRadius:4,overflow:'hidden',border:`2px solid ${activeImage===img?'#fff':'rgba(255,255,255,0.1)'}`,background:'#1A1A1A',cursor:'pointer',padding:0}}>
                <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </button>
            ))}
            {p.videoUrl&&(
              <button onClick={()=>{}} style={{flexShrink:0,width:52,height:52,borderRadius:4,border:'2px solid rgba(255,255,255,0.1)',background:'#1A1A1A',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Play size={18} color="#fff"/>
              </button>
            )}
          </div>
        )}

        <div style={{padding:'20px'}}>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:4,fontWeight:600,letterSpacing:'.06em'}}>{p.category}{p.sku?` · #${p.sku}`:''}</div>
          <h2 style={{fontSize:22,fontWeight:700,color:'#fff',margin:'0 0 8px',lineHeight:1.3}}>{p.name}</h2>
          
          {/* Rating */}
          {p.sales>0&&(
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:14}}>
              <div style={{display:'flex',gap:1}}>
                {Array.from({length:5},(_,i)=><Star key={i} size={12} fill={i<rating?'#F59E0B':'none'} color={i<rating?'#F59E0B':'rgba(255,255,255,0.15)'}/>)}
              </div>
              <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>({Math.min(p.sales*2,120)})</span>
            </div>
          )}

          {/* Price */}
          <div style={{display:'flex',alignItems:'flex-end',gap:10,marginBottom:18}}>
            <span style={{fontSize:32,fontWeight:700,color:'#fff'}}>{p.price.toLocaleString()} <span style={{fontSize:14,color:'rgba(255,255,255,0.4)',fontWeight:400}}>{currency}</span></span>
            {p.cost&&p.cost>p.price&&<span style={{fontSize:16,color:'rgba(255,255,255,0.4)',textDecoration:'line-through',marginBottom:4}}>{p.cost.toLocaleString()}</span>}
          </div>

          {/* Stock */}
          {(!p.type||p.type==='product')&&p.stock>0&&p.stock<=5&&(
            <div style={{fontSize:12,color:'#EF4444',fontWeight:500,marginBottom:14}}>⚡ متبقي {p.stock} فقط في المخزون</div>
          )}

          {p.description&&<p style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:20}}>{p.description}</p>}

          {/* Colors */}
          {p.colors?.length>0&&(
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:8,fontWeight:600,letterSpacing:'.05em'}}>اللون</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {p.colors.map(clr=>{
                  const colorImg=p.colorImages?.[clr];
                  const CM:Record<string,string>={'أسود':'#1a1a1a','أبيض':'#f5f5f5','أحمر':'#ef4444','أزرق':'#3b82f6','أخضر':'#22c55e','رمادي':'#6b7280','بيج':'#d4b896','وردي':'#f472b6','بني':'#92400e','كحلي':'#1e3a5f','بنفسجي':'#a855f7','برتقالي':'#f97316'};
                  return colorImg?(
                    <button key={clr} onClick={()=>{setColor(clr);setActiveImage(colorImg||p.imageUrl||'');}} style={{padding:4,borderRadius:8,border:`2px solid ${color===clr?'#fff':'transparent'}`,cursor:'pointer',background:'transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <img src={colorImg} alt={clr} style={{width:44,height:44,objectFit:'cover',borderRadius:4}}/>
                      <span style={{fontSize:9,color:color===clr?'#fff':'rgba(255,255,255,0.5)',fontWeight:500}}>{clr}</span>
                    </button>
                  ):(
                    <button key={clr} onClick={()=>setColor(clr)} style={{width:32,height:32,borderRadius:'50%',background:CM[clr]||'#ccc',border:`3px solid ${color===clr?'#fff':'transparent'}`,cursor:'pointer',transition:'border-color .15s',boxShadow:'inset 0 0 0 1px rgba(0,0,0,.1)'}} title={clr}/>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {p.sizes?.length>0&&(
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:8,fontWeight:600,letterSpacing:'.05em'}}>المقاس</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {p.sizes.map(s=>(
                  <button key={s} onClick={()=>setSize(s)} style={{padding:'9px 18px',borderRadius:99,border:`1px solid ${size===s?'#fff':'rgba(255,255,255,0.2)'}`,background:size===s?'rgba(255,255,255,0.15)':'transparent',color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer',transition:'all .15s'}}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Variant rows */}
          <div style={{marginBottom:12}}>
            {variantRows.map((row,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,padding:'10px 12px',background:'rgba(255,255,255,0.04)',borderRadius:8,border:'1px solid rgba(255,255,255,0.06)'}}>
                <span style={{fontSize:12,color:'rgba(255,255,255,0.6)',minWidth:60}}>{row.color||'—'} / {row.size||'—'}</span>
                <div style={{display:'flex',alignItems:'center',gap:6,marginRight:'auto'}}>
                  <button onClick={()=>setVariantRows(prev=>prev.map((r,j)=>j===i?{...r,qty:Math.max(1,r.qty-1)}:r))} style={{width:26,height:26,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Minus size={10}/></button>
                  <span style={{fontSize:14,fontWeight:600,color:'#fff',minWidth:20,textAlign:'center'}}>{row.qty}</span>
                  <button onClick={()=>setVariantRows(prev=>prev.map((r,j)=>j===i?{...r,qty:r.qty+1}:r))} style={{width:26,height:26,borderRadius:'50%',background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Plus size={10}/></button>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:'#fff',minWidth:50,textAlign:'left'}}>{(p.price*row.qty).toLocaleString()} {currency}</div>
                {variantRows.length>1&&(
                  <button onClick={()=>setVariantRows(prev=>prev.filter((_,j)=>j!==i))} style={{width:24,height:24,borderRadius:'50%',background:'rgba(239,68,68,0.15)',border:'none',color:'#EF4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={10}/></button>
                )}
              </div>
            ))}
          </div>

          {/* Add another option */}
          {(p.sizes?.length>0||p.colors?.length>0)&&(
            <button onClick={()=>setVariantRows(prev=>[...prev,{size:p.sizes?.[0]||'',color:p.colors?.[0]||'',qty:1}])}
              style={{padding:'8px 16px',borderRadius:99,background:'rgba(255,255,255,0.04)',border:'1px dashed rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:6,marginBottom:14}}>
              <Plus size={12}/> أضف مقاس/لون آخر
            </button>
          )}

          {/* Gift option */}
          <div style={{marginBottom:16,padding:'12px 14px',background:'rgba(255,255,255,0.03)',borderRadius:8,border:'1px solid rgba(255,255,255,0.05)'}}>
            <button onClick={()=>setGiftWrap(!giftWrap)} style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',color:'#fff',fontSize:13,fontWeight:500,cursor:'pointer',padding:0}}>
              <Gift size={16} color={giftWrap?'#22C55E':'rgba(255,255,255,0.4)'}/>
              {giftWrap?'🎁 تغليف هدية (+15 درهم)':'هل هذه هدية؟ (+15 درهم)'}
            </button>
            {giftWrap&&(
              <input placeholder="رسالة للهدية..." value={giftMsg} onChange={e=>setGiftMsgLocal(e.target.value)}
                style={{marginTop:8,width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',fontSize:12,outline:'none',boxSizing:'border-box',fontFamily:'Tajawal,sans-serif'}}/>
            )}
          </div>

          {/* Custom fields */}
          {p.customFields&&p.customFields.filter(f=>f.value).length>0&&(
            <div style={{marginBottom:16,padding:'10px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,display:'flex',flexDirection:'column',gap:5}}>
              {p.customFields.filter(f=>f.value).map(f=>(
                <div key={f.id} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'rgba(255,255,255,0.4)'}}>{f.label}</span>
                  <span style={{color:'#fff',fontWeight:500}}>{f.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Service meta */}
          {p.type==='service'&&(p.duration||p.workArea)&&(
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              {p.duration&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.06)',padding:'5px 12px',borderRadius:99}}><Clock size={11}/> {p.duration}</span>}
              {p.workArea&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.06)',padding:'5px 12px',borderRadius:99}}><MapPin size={11}/> {p.workArea}</span>}
            </div>
          )}

          {p.type==='digital'&&<div style={{marginBottom:16,padding:'10px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,fontSize:12,color:'rgba(255,255,255,0.5)'}}>💻 منتج رقمي — يُرسل بعد تأكيد الطلب</div>}

          {/* Related */}
          {p.category&&(window as any).__sfProducts?.filter((rp:any)=>rp.id!==p.id&&rp.category===p.category).length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginBottom:10,fontWeight:600,letterSpacing:'.06em'}}>قد يعجبك أيضاً</div>
              <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
                {(window as any).__sfProducts.filter((rp:any)=>rp.id!==p.id&&rp.category===p.category).slice(0,4).map((rp:any)=>(
                  <div key={rp.id} onClick={()=>{onClose();setTimeout(()=>document.dispatchEvent(new CustomEvent('viewProduct',{detail:rp})),50);}}
                    style={{flexShrink:0,width:80,borderRadius:6,overflow:'hidden',cursor:'pointer',background:'#1A1A1A'}}>
                    <div style={{height:80,background:'#222',overflow:'hidden'}}>
                      {rp.imageUrl?<img src={rp.imageUrl} alt={rp.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{rp.emoji||'📦'}</div>}
                    </div>
                    <div style={{padding:'5px 7px'}}><div style={{fontSize:9,fontWeight:500,color:'#fff',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{rp.name}</div><div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,0.5)'}}>{rp.price.toLocaleString()}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{padding:'14px 20px 24px',background:'#111',position:'sticky',bottom:0,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:12,color:'rgba(255,255,255,0.4)'}}>
            <span>{variantRows.reduce((s,r)=>s+r.qty,0)} قطعة</span>
            <span>الإجمالي: {(p.price*variantRows.reduce((s,r)=>s+r.qty,0)+(giftWrap?15:0)).toLocaleString()} {currency}</span>
          </div>
          <button onClick={handleAddAll} style={{width:'100%',height:52,background:added?'#22C55E':'#fff',border:'none',color:added?'#fff':'#0A0A0A',fontSize:15,fontWeight:600,cursor:'pointer',transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:8,borderRadius:99}}>
            {added?<><Check size={18}/>تمت الإضافة ✓</>:<><ShoppingCart size={16}/>أضف للسلة</>}
          </button>
        </div>
      </div>
    </div>
  </>);
}

// ═══════════════════════════════════════════════════════════════ HERO
function HeroSection({brand,onShop,isNight}:{brand:StoreInfo['brand'];onShop:()=>void;isNight:boolean}) {
  return (
    <div style={{padding:'32px 20px 28px',textAlign:'center',position:'relative'}}>
      {brand.logo&&<img src={brand.logo} alt={brand.name} style={{width:64,height:64,borderRadius:'50%',objectFit:'contain',marginBottom:14,border:'1px solid rgba(255,255,255,0.1)'}}/>}
      <h1 style={{fontSize:'clamp(24px,5vw,36px)',fontWeight:700,color:'#fff',margin:'0 0 6px',letterSpacing:'-0.03em',lineHeight:1.1}}>{brand.name||'المتجر'}</h1>
      {brand.description&&<p style={{fontSize:13,color:'rgba(255,255,255,0.5)',margin:'0 auto 16px',maxWidth:360,lineHeight:1.6}}>{brand.description}</p>}
      <button onClick={onShop} style={{padding:'11px 32px',borderRadius:99,background:'#fff',border:'none',color:'#0A0A0A',fontSize:14,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:7,transition:'all .2s'}}>
        استكشف المتجر <ArrowRight size={15}/>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ CART SIDEBAR
function CartSidebar({cart,storeInfo,userId,onClose,onOrderSuccess,isNight}:{cart:ReturnType<typeof useCart>;storeInfo:StoreInfo;userId:string;onClose:()=>void;onOrderSuccess:(id:string)=>void;isNight:boolean}) {
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
      if(r.ok){const d=await r.json();setCouponDiscount(d.discount||0);setCouponMsg(d.discount>0?`✅ خصم ${d.discount} ${cur}`:'❌ الكود غير صحيح');}
      else{setCouponDiscount(0);setCouponMsg('❌ الكود غير صحيح');}
    }catch{setCouponDiscount(0);setCouponMsg('❌ تعذر التحقق');}
  };

  const shareCart=()=>{
    const itemsText=cart.items.map(i=>`• ${i.product.name} (${i.size} ${i.color}) x${i.quantity} — ${i.product.price*i.quantity} ${cur}${i.giftWrap?' 🎁':''}`).join('\n');
    const msg=`🛒 سلتي من ${storeInfo.brand.name}:\n\n${itemsText}\n\n💰 المجموع: ${cart.total} ${cur}`;
    navigator.share?.({title:`سلتي من ${storeInfo.brand.name}`,text:msg}).catch(()=>{})||navigator.clipboard?.writeText(msg);
  };

  const handleOrder=async()=>{
    if(!form.name||!form.phone||!form.city){alert('الاسم، الهاتف والمدينة مطلوبون');return;}
    setLoading(true);
    try{
      const items=cart.items.map(i=>({productId:i.product.id,productName:i.product.name,price:i.product.price,quantity:i.quantity,size:i.size,color:i.color,giftWrap:i.giftWrap,giftMessage:i.giftMessage}));
      const r=await fetch('/api/orders/public',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId,items,customerName:form.name,customerPhone:form.phone,city:form.city,address:form.address,total:grandTotal,source:'Storefront',notes:`${form.notes}${form.subscribe?' · يريد عروض':''}`})});
      const data=await r.json();
      if(!r.ok)throw new Error(data.error);
      setOrderId(data.order.id);
      // Save to local storage for live ticker
      try{
        const recent=JSON.parse(localStorage.getItem('sahar_recent_orders')||'[]');
        localStorage.setItem('sahar_recent_orders',JSON.stringify([{name:form.name,city:form.city,product:cart.items[0]?.product?.name||'منتج',time:new Date().toISOString()},...recent].slice(0,20)));
      }catch{}
      const phone=storeInfo.brand.phone?.replace(/\D/g,'');
      const itemsText=cart.items.map(i=>`• ${i.product.name} (${i.size} ${i.color}) x${i.quantity} — ${i.product.price*i.quantity} ${cur}${i.giftWrap?' 🎁':''}`).join('\n');
      const msg=`مرحباً ${storeInfo.brand.name}! 👋\n\nأريد تأكيد طلبي:\n\n${itemsText}\n\n💰 الإجمالي: ${grandTotal} ${cur}\n\n👤 ${form.name}\n📱 ${form.phone}\n📍 ${form.city}\n🏠 ${form.address||'—'}`;
      if(phone)setTimeout(()=>window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank'),500);
      cart.clear();try{localStorage.removeItem('sahar_cart');}catch{}
      setStep('success');onOrderSuccess(data.order.id);
    }catch(e:any){alert(`حدث خطأ: ${e.message}`);}
    setLoading(false);
  };

  const inp:React.CSSProperties={width:'100%',padding:'11px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'Tajawal,sans-serif'};

  return (
    <div style={{position:'fixed',inset:0,zIndex:400,display:'flex'}}>
      <div onClick={onClose} style={{flex:1,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)'}}/>
      <div style={{width:'min(420px,100vw)',background:'#111',display:'flex',flexDirection:'column',overflowY:'auto',boxShadow:'-16px 0 48px rgba(0,0,0,0.5)',color:'#fff'}}>
        <div style={{padding:'16px 18px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:2,background:'#111'}}>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.06)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={16}/></button>
          <div style={{flex:1,fontSize:15,fontWeight:600}}>{step==='cart'?`سلتك (${cart.count})`:step==='checkout'?'تأكيد الطلب':'تم ✓'}</div>
          {step==='cart'&&<button onClick={shareCart} style={{width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.06)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Share2 size={15}/></button>}
        </div>

        {step==='cart'&&(
          <div style={{flex:1,overflow:'auto',padding:16}}>
            {cart.items.length===0?(
              <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.4)'}}>
                <ShoppingCart size={44} style={{margin:'0 auto 14px',opacity:.2}}/>
                <div style={{fontSize:15,fontWeight:500,marginBottom:6}}>سلتك فارغة</div>
                <button onClick={onClose} style={{marginTop:12,padding:'9px 24px',borderRadius:99,background:'#fff',border:'none',color:'#0A0A0A',fontWeight:600,fontSize:13,cursor:'pointer'}}>تصفح المنتجات</button>
              </div>
            ):(
              <>
                {cart.items.map((item,i)=>(
                  <div key={i} style={{display:'flex',gap:12,padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    <div style={{width:60,height:60,borderRadius:6,background:'#1A1A1A',overflow:'hidden',flexShrink:0}}>
                      {item.product.imageUrl?<img src={item.product.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,color:'rgba(255,255,255,0.1)'}}>{item.product.emoji||'📦'}</div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600}}>{item.product.name}{item.giftWrap?' 🎁':''}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',marginTop:2}}>{item.size} · {item.color}</div>
                      {item.giftMessage&&<div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:2}}>💬 {item.giftMessage}</div>}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <button onClick={()=>cart.update(item.product.id,item.size,item.color,item.quantity-1)} style={{width:24,height:24,borderRadius:'50%',background:'rgba(255,255,255,0.08)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Minus size={10}/></button>
                          <span style={{fontSize:13,fontWeight:500,minWidth:20,textAlign:'center'}}>{item.quantity}</span>
                          <button onClick={()=>cart.update(item.product.id,item.size,item.color,item.quantity+1)} style={{width:24,height:24,borderRadius:'50%',background:'rgba(255,255,255,0.08)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Plus size={10}/></button>
                        </div>
                        <span style={{fontSize:14,fontWeight:600}}>{(item.product.price*item.quantity+(item.giftWrap?15:0)).toLocaleString()} {cur}</span>
                      </div>
                    </div>
                    <button onClick={()=>cart.remove(item.product.id,item.size,item.color)} style={{width:26,height:26,borderRadius:'50%',background:'rgba(239,68,68,0.15)',border:'none',color:'#EF4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}><X size={11}/></button>
                  </div>
                ))}
                <div style={{padding:'16px 0'}}>
                  <button onClick={()=>setStep('checkout')} style={{width:'100%',height:50,borderRadius:99,background:'#fff',border:'none',color:'#0A0A0A',fontSize:15,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    متابعة الطلب <ArrowRight size={16}/>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step==='checkout'&&(
          <div style={{flex:1,overflow:'auto',padding:'16px 18px',display:'flex',flexDirection:'column',gap:10}}>
            <input style={inp} placeholder="الاسم الكامل *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            <input style={inp} placeholder="رقم الهاتف *" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} dir="ltr" type="tel"/>
            <div style={{position:'relative'}}>
              <input style={inp} placeholder="المدينة *" value={citySearch||form.city} onChange={e=>{setCitySearch(e.target.value);setShowCities(true);setForm(f=>({...f,city:e.target.value}));}} onFocus={()=>setShowCities(true)} onBlur={()=>setTimeout(()=>setShowCities(false),200)}/>
              {showCities&&filteredCities.length>0&&(
                <div style={{position:'absolute',top:'100%',right:0,left:0,background:'#1A1A1A',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,maxHeight:180,overflowY:'auto',zIndex:10,marginTop:4}}>
                  {filteredCities.map(city=>(
                    <div key={city} onClick={()=>{setForm(f=>({...f,city}));setCitySearch(city);setShowCities(false);}} style={{padding:'9px 14px',fontSize:13,cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,0.06)'}} onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}} onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background=''}}>{city}</div>
                  ))}
                </div>
              )}
            </div>
            <textarea style={{...inp,resize:'none'} as any} placeholder="العنوان بالتفصيل" rows={2} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/>
            <textarea style={{...inp,resize:'none'} as any} placeholder="ملاحظة (اختياري)" rows={1} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
            <div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:6,fontWeight:600}}>طريقة الدفع</div>
              <div style={{display:'flex',gap:8}}>
                {[['cod','💵 عند الاستلام'],['virement','🏦 تحويل']].map(([v,l])=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,paymentMethod:v as any}))} style={{flex:1,padding:'10px',borderRadius:8,border:`1px solid ${form.paymentMethod===v?'#fff':'rgba(255,255,255,0.15)'}`,background:form.paymentMethod===v?'rgba(255,255,255,0.1)':'transparent',color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer'}}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:6,fontWeight:600}}>كود الخصم</div>
              <div style={{display:'flex',gap:8}}>
                <input style={{...inp,flex:1,textTransform:'uppercase'}} placeholder="أدخل الكود" value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setCouponMsg('');}} dir="ltr"/>
                <button onClick={applyCoupon} style={{padding:'0 14px',borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer'}}>تطبيق</button>
              </div>
              {couponMsg&&<div style={{fontSize:10,marginTop:4,color:couponDiscount>0?'#22C55E':'#EF4444',fontWeight:500}}>{couponMsg}</div>}
            </div>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:'rgba(255,255,255,0.5)'}}>
              <input type="checkbox" checked={form.subscribe} onChange={e=>setForm(f=>({...f,subscribe:e.target.checked}))} style={{accentColor:'#fff',width:14,height:14}}/>
              أريد العروض عبر واتساب
            </label>
            <div style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'14px 16px',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',marginBottom:8,fontWeight:600}}>ملخص الطلب</div>
              {cart.items.map((item,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(255,255,255,0.6)',marginBottom:4}}>
                  <span>{item.product.name} ×{item.quantity}{item.giftWrap?' 🎁':''}</span>
                  <span>{(item.product.price*item.quantity+(item.giftWrap?15:0)).toLocaleString()} {cur}</span>
                </div>
              ))}
              <div style={{paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.08)',marginTop:8,display:'flex',flexDirection:'column',gap:4}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(255,255,255,0.5)'}}><span>المجموع</span><span>{cart.total.toLocaleString()} {cur}</span></div>
                {couponDiscount>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#22C55E',fontWeight:500}}><span>الخصم</span><span>-{couponDiscount.toLocaleString()} {cur}</span></div>}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'rgba(255,255,255,0.5)'}}><span>التوصيل</span><span>{form.city?`${deliveryCost} ${cur}`:'—'}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:15,fontWeight:600,paddingTop:6,borderTop:'1px solid rgba(255,255,255,0.08)'}}><span>الإجمالي</span><span>{grandTotal.toLocaleString()} {cur}</span></div>
              </div>
            </div>
            <button onClick={handleOrder} disabled={loading} style={{width:'100%',height:50,borderRadius:99,background:'#22C55E',border:'none',color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',opacity:loading?.7:1}}>
              {loading?'⟳ جارٍ الإرسال...':<><MessageCircle size={15}/> تأكيد عبر واتساب</>}
            </button>
            <button onClick={()=>setStep('cart')} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:12,padding:4}}>← رجوع</button>
          </div>
        )}

        {step==='success'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(34,197,94,0.1)',border:'2px solid #22C55E',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
              <Check size={36} color="#22C55E"/>
            </div>
            <h2 style={{fontSize:22,fontWeight:600,marginBottom:8}}>تم الطلب! 🎉</h2>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.5)',lineHeight:1.7,marginBottom:20}}>سيتواصل معك البائع لتأكيد الطلب</p>
            {orderId&&<div style={{fontSize:11,color:'rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.04)',borderRadius:6,padding:'6px 14px',marginBottom:16}}>{orderId}</div>}
            <button onClick={onClose} style={{padding:'11px 28px',borderRadius:99,background:'#fff',border:'none',color:'#0A0A0A',fontWeight:600,fontSize:14,cursor:'pointer'}}>متابعة التسوق</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ TRACKING MODAL
function TrackingModal({userId,storeInfo,onClose,isNight}:{userId:string;storeInfo:StoreInfo;onClose:()=>void;isNight:boolean}) {
  const [query,setQuery]=useState('');
  const [mode,setMode]=useState<'phone'|'code'>('code');
  const [orders,setOrders]=useState<any[]>([]);
  const [singleOrder,setSingleOrder]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const cur=storeInfo.brand.currency||'MAD';
  const STATUS_AR:Record<string,string>={pending:'⏳ بانتظار التأكيد',approved:'✅ تم التأكيد',processing:'⚙️ جارٍ التحضير',shipped:'🚚 في الطريق',delivered:'📦 وصل',cancelled:'❌ ملغي'};
  const STATUS_COLOR:Record<string,string>={pending:'#F59E0B',approved:'#22C55E',processing:'#F59E0B',shipped:'#22C55E',delivered:'#22C55E',cancelled:'#EF4444'};

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
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',backdropFilter:'blur(8px)',zIndex:350,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#111',borderRadius:12,width:'100%',maxWidth:440,padding:24,boxShadow:'0 16px 48px rgba(0,0,0,0.5)',color:'#fff'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:600}}>📦 تتبع طلبك</h2>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.06)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:12}}>
          {[['code','🔑 كود التتبع'],['phone','📱 رقم الهاتف']].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m as any);setQuery('');setSearched(false);setSingleOrder(null);setOrders([]);}} style={{flex:1,padding:'8px',borderRadius:8,border:`1px solid ${mode===m?'#fff':'rgba(255,255,255,0.15)'}`,background:mode===m?'rgba(255,255,255,0.1)':'transparent',color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer'}}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <input placeholder={mode==='code'?'أدخل كودك':'أدخل رقم هاتفك'} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} dir="ltr"
            style={{flex:1,padding:'10px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:13,outline:'none',textTransform:mode==='code'?'uppercase':'none',fontFamily:'Tajawal,sans-serif'}}/>
          <button onClick={search} disabled={loading} style={{padding:'8px 18px',borderRadius:8,background:'#fff',border:'none',color:'#0A0A0A',fontWeight:600,cursor:'pointer',fontSize:14}}>{loading?'⟳':'بحث'}</button>
        </div>
        {searched&&!singleOrder&&orders.length===0&&<p style={{color:'rgba(255,255,255,0.4)',textAlign:'center',fontSize:13,padding:'12px 0'}}>لم نجد طلبات</p>}
        {singleOrder&&(
          <div style={{background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:8,padding:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:14,fontWeight:600}}>طلبك</span>
              <span style={{fontSize:12,fontWeight:600,color:STATUS_COLOR[singleOrder.status]||'#fff'}}>{STATUS_AR[singleOrder.status]||singleOrder.status}</span>
            </div>
            {(singleOrder.items||[]).map((item:any,i:number)=><div key={i} style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:3}}>• {item.productName} × {item.quantity}</div>)}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8,paddingTop:8,borderTop:'1px solid rgba(34,197,94,0.15)'}}>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>{singleOrder.city}</span>
              <span style={{fontSize:14,fontWeight:600}}>{singleOrder.total} {cur}</span>
            </div>
          </div>
        )}
        {orders.map((o:any)=>(
          <div key={o.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'12px 14px',marginBottom:8,border:'1px solid rgba(255,255,255,0.06)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.3)',fontFamily:'monospace'}}>{o.id}</span>
              <span style={{fontSize:11,fontWeight:500,color:STATUS_COLOR[o.status]||'rgba(255,255,255,0.5)'}}>{STATUS_AR[o.status]||o.status}</span>
            </div>
            {(o.items||[]).map((item:any,i:number)=><div key={i} style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:2}}>• {item.productName} x{item.quantity}</div>)}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11}}>
              <span style={{color:'rgba(255,255,255,0.3)'}}>{new Date(o.createdAt).toLocaleDateString('ar-MA')}</span>
              <span style={{fontWeight:600}}>{o.total} {cur}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ FLOATING CHAT
function FloatingChat({userId,storeInfo,isNight}:{userId:string;storeInfo:StoreInfo;isNight:boolean}) {
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState<ChatMsg[]>([{role:'ai',content:`مرحباً! 👋 أنا مساعد ${storeInfo.brand.name||'المتجر'}\nكيف يمكنني مساعدتك؟`}]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const [unread,setUnread]=useState(0);
  const endRef=useRef<HTMLDivElement>(null);
  
  useEffect(()=>{if(open){setUnread(0);endRef.current?.scrollIntoView();}},[msgs,open]);
  
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
    <button onClick={()=>setOpen(v=>!v)} style={{width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',position:'fixed',bottom:24,left:16,zIndex:150,backdropFilter:'blur(8px)'}}>
      {open?<X size={18}/>:<Bot size={18}/>}
      {unread>0&&!open&&<div style={{position:'absolute',top:-4,right:-4,width:16,height:16,background:'#EF4444',borderRadius:'50%',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #0A0A0A',color:'#fff'}}>{unread}</div>}
    </button>
    {open&&(
      <div style={{position:'fixed',bottom:84,left:16,right:16,maxWidth:360,marginLeft:'auto',background:'#111',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,boxShadow:'0 16px 48px rgba(0,0,0,0.5)',zIndex:200,overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:420}}>
        <div style={{padding:'12px 16px',background:'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={14}/></div>
          <div><div style={{fontSize:12,fontWeight:600}}>مساعد {storeInfo.brand.name}</div><div style={{fontSize:9,color:'rgba(255,255,255,0.4)'}}>AI · متاح الآن</div></div>
          <button onClick={()=>setOpen(false)} style={{marginRight:'auto',background:'none',border:'none',color:'rgba(255,255,255,0.6)',cursor:'pointer'}}><X size={14}/></button>
        </div>
        <div style={{flex:1,overflow:'auto',padding:'10px',display:'flex',flexDirection:'column',gap:8}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{maxWidth:'85%',alignSelf:m.role==='user'?'flex-end':'flex-start'}}>
              <div style={{padding:'7px 11px',borderRadius:10,background:m.role==='user'?'#fff':'rgba(255,255,255,0.06)',color:m.role==='user'?'#0A0A0A':'#fff',fontSize:11,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{padding:'7px 11px',borderRadius:10,background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.3)',fontSize:11,alignSelf:'flex-start'}}>يكتب...</div>}
          <div ref={endRef}/>
        </div>
        <div style={{padding:'4px 8px',display:'flex',gap:4,flexWrap:'wrap',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
          {['المنتجات','التوصيل','تتبع طلبي'].map(q=>(
            <button key={q} onClick={()=>send(q)} style={{fontSize:9,padding:'3px 8px',borderRadius:99,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.5)',cursor:'pointer'}}>{q}</button>
          ))}
        </div>
        <div style={{padding:'6px 8px',borderTop:'1px solid rgba(255,255,255,0.04)',display:'flex',gap:6}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="اكتب سؤالك..."
            style={{flex:1,padding:'7px 10px',fontSize:11,borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#fff',outline:'none',fontFamily:'Tajawal,sans-serif'}}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:30,height:30,borderRadius:'50%',background:'#fff',border:'none',color:'#0A0A0A',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:(!input.trim()||loading)?.5:1}}><Send size={11}/></button>
        </div>
      </div>
    )}
  </>);
}

// ═══════════════════════════════════════════════════════════════ MAIN
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
  const [isNight,setIsNight]=useState(isNightTime());
  const [viewProduct,setViewProduct]=useState<SProduct|null>(null);
  const [showCart,setShowCart]=useState(false);
  const [showTrack,setShowTrack]=useState(false);
  const [tab,setTab]=useState<'all'|'products'|'services'|'digital'>('all');
  const [liveTicker,setLiveTicker]=useState<{name:string;city:string;product:string;time:string}[]>([]);
  const [successOrderId,setSuccessOrderId]=useState('');
  const [cartAnim,setCartAnim]=useState(false);
  void successOrderId;

  // Night mode auto-update
  useEffect(()=>{
    const t=setInterval(()=>setIsNight(isNightTime()),60000);
    return()=>clearInterval(t);
  },[]);

  // Live ticker from real recent orders
  useEffect(()=>{
    const recentOrders=JSON.parse(localStorage.getItem('sahar_recent_orders')||'[]');
    if(recentOrders.length){
      const o=recentOrders[Math.floor(Math.random()*recentOrders.length)];
      const mins=Math.floor(Math.random()*12)+2;
      setLiveTicker([{name:o.name,city:o.city,product:o.product,time:`${mins} دقائق`}]);
      const tid=setTimeout(()=>setLiveTicker([]),5000);
      return()=>clearTimeout(tid);
    }
  },[cart.items.length]);

  const handleAddToCart=(p:SProduct,size?:string,color?:string)=>{
    cart.add(p,size||p.sizes?.[0]||'',color||p.colors?.[0]||'');
    setCartAnim(true);setTimeout(()=>setCartAnim(false),600);
  };

  useEffect(()=>{(window as any).__sfProducts=products;},[products]);
  useEffect(()=>{
    if(!products.length)return;
    const pid=new URLSearchParams(window.location.search).get('p');
    if(pid){const f=products.find(x=>x.id===pid);if(f)setViewProduct(f);}
  },[products]);
  useEffect(()=>{if(viewProduct)trackStoreEvent(userId,'view',{id:viewProduct.id,name:viewProduct.name});},[viewProduct?.id]);
  useEffect(()=>{
    const h=(e:any)=>{if(e.detail)setViewProduct(e.detail);};
    document.addEventListener('viewProduct',h);return()=>document.removeEventListener('viewProduct',h);
  },[]);

  const allProducts=products.filter(p=>(!p.type||p.type==='product'));
  const allServices=products.filter(p=>p.type==='service');
  const allDigital=products.filter(p=>p.type==='digital');
  const showProducts=tab==='all'||tab==='products';
  const showServices=tab==='all'||tab==='services';
  const showDigital=tab==='all'||tab==='digital';

  // ── Loading state
  if(loading) return <PageSkeleton/>;

  if(!userId) return (
    <div dir="rtl" style={{minHeight:'100dvh',background:'#0A0A0A',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,textAlign:'center',gap:14,fontFamily:'Tajawal,system-ui,sans-serif',color:'#fff'}}>
      <div style={{fontSize:48,opacity:.3}}>✦</div>
      <div style={{fontSize:20,fontWeight:600}}>متجر SAHAR Shop</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',maxWidth:280,lineHeight:1.7}}>اطلب من التاجر مشاركة رابط متجره</div>
      <a href="/" style={{padding:'9px 22px',borderRadius:99,background:'#fff',color:'#0A0A0A',fontWeight:600,fontSize:13,textDecoration:'none',marginTop:4}}>الصفحة الرئيسية</a>
    </div>
  );

  if(error||(!loading&&!storeInfo)) return (
    <div dir="rtl" style={{minHeight:'100dvh',background:'#0A0A0A',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',textAlign:'center',padding:32,fontFamily:'Tajawal,system-ui,sans-serif'}}>
      <div><div style={{fontSize:36,marginBottom:12,opacity:.3}}>✦</div><div style={{fontSize:16,fontWeight:600,marginBottom:6}}>المتجر غير موجود</div><div style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>{error||'تحقق من الرابط'}</div></div>
    </div>
  );

  const brand=storeInfo!.brand;
  const cur=brand.currency||'MAD';

  // Empty store
  if(!loading&&!error&&storeInfo&&products.length===0) return (
    <div dir="rtl" style={{minHeight:'100dvh',background:'#0A0A0A',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',textAlign:'center',fontFamily:'Tajawal,system-ui,sans-serif',color:'#fff'}}>
      <div style={{width:72,height:72,borderRadius:'50%',overflow:'hidden',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
        {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span style={{fontSize:32}}>✦</span>}
      </div>
      <h1 style={{fontSize:24,fontWeight:600,marginBottom:8}}>{brand.name||'المتجر'}</h1>
      <div style={{fontSize:60,margin:'20px 0 14px',opacity:.1}}>📦</div>
      <h2 style={{fontSize:18,fontWeight:500,marginBottom:8}}>المتجر قيد التجهيز</h2>
      <p style={{fontSize:14,color:'rgba(255,255,255,0.4)',maxWidth:300,lineHeight:1.8,marginBottom:28}}>ستضاف المنتجات قريباً — تابعونا!</p>
      {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'12px 24px',borderRadius:99,background:'#22C55E',color:'#fff',fontSize:14,fontWeight:600,textDecoration:'none'}}>💬 تواصل معنا</a>}
    </div>
  );

  return (
    <div dir="rtl" style={{minHeight:'100dvh',background:'#0A0A0A',color:'#fff',fontFamily:'Tajawal,system-ui,sans-serif',paddingBottom:80}}>
      <style>{`
        body{background:#0A0A0A!important;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>

      {/* Header */}
      <header style={{position:'sticky',top:0,zIndex:100,background:'rgba(10,10,10,0.85)',backdropFilter:'blur(16px)',padding:'8px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,height:56,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {brand.logo&&<img src={brand.logo} alt={brand.name} style={{width:28,height:28,borderRadius:'50%',objectFit:'contain'}}/>}
          <div style={{fontSize:13,fontWeight:700}}>{brand.name}</div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <button onClick={()=>setShowTrack(true)} style={{padding:'6px 10px',borderRadius:99,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.6)',fontSize:10,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><Package size={11}/> تتبع</button>
          {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'6px 10px',borderRadius:99,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',color:'#22C55E',fontSize:10,fontWeight:500,cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',gap:4}}><MessageCircle size={11}/> واتساب</a>}
          <button onClick={()=>setShowCart(true)} style={{position:'relative',padding:'6px 10px',borderRadius:99,background:cartAnim?'#fff':'rgba(255,255,255,0.04)',border:`1px solid ${cartAnim?'transparent':'rgba(255,255,255,0.08)'}`,color:cartAnim?'#0A0A0A':'#fff',fontSize:10,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:4,transition:'all .2s'}}>
            <ShoppingCart size={13}/>
            {cart.count>0&&<span>({cart.count})</span>}
          </button>
        </div>
      </header>

      {/* Hero */}
      <HeroSection brand={brand} onShop={()=>setTab('products')} isNight={isNight}/>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,padding:'4px',margin:'0 14px 20px',background:'rgba(255,255,255,0.04)',borderRadius:99}}>
        {[['all','✦ الكل'],['products','🛍️ منتجات'],['services','🔧 خدمات'],['digital','📱 رقمي']].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v as any)} style={{flex:1,padding:'9px',borderRadius:99,border:'none',background:tab===v?'#fff':'transparent',color:tab===v?'#0A0A0A':'rgba(255,255,255,0.5)',fontSize:11,fontWeight:600,cursor:'pointer',transition:'all .2s'}}>{l}</button>
        ))}
      </div>

      <div style={{padding:'0 14px'}}>
        {/* Products */}
        {showProducts&&allProducts.length>0&&(
          <div style={{marginBottom:40}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:14}}>
              {allProducts.map(p=><ProductCard key={p.id} p={p} currency={cur} onAdd={handleAddToCart} onView={p=>setViewProduct(p)} isNight={isNight}/>)}
            </div>
          </div>
        )}

        {/* Services */}
        {showServices&&allServices.length>0&&(
          <div style={{marginBottom:40}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <span style={{fontSize:14,fontWeight:600}}>خدماتنا</span>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.05)',padding:'2px 8px',borderRadius:99}}>{allServices.length}</span>
            </div>
            <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:8,scrollbarWidth:'none'}}>
              {allServices.map(p=><ServiceCard key={p.id} p={p} currency={cur} onView={p=>setViewProduct(p)} isNight={isNight}/>)}
            </div>
          </div>
        )}

        {/* Digital */}
        {showDigital&&allDigital.length>0&&(
          <div style={{marginBottom:40}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:14}}>
              {allDigital.map(p=><ProductCard key={p.id} p={p} currency={cur} onAdd={handleAddToCart} onView={p=>setViewProduct(p)} isNight={isNight}/>)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {allProducts.length===0&&allServices.length===0&&allDigital.length===0&&(
          <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(255,255,255,0.3)'}}>
            <Package size={40} style={{marginBottom:12,opacity:.2}}/>
            <div style={{fontSize:14,fontWeight:500}}>لا توجد منتجات بعد</div>
          </div>
        )}

        {/* Footer */}
        <div style={{marginTop:40,paddingTop:20,borderTop:'1px solid rgba(255,255,255,0.06)',textAlign:'center',paddingBottom:20}}>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:6}}>{brand.name}</div>
          <div style={{display:'flex',justifyContent:'center',gap:14}}>
            {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#22C55E',textDecoration:'none'}}>واتساب</a>}
            {brand.instagram&&<a href={`https://instagram.com/${brand.instagram}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'rgba(255,255,255,0.4)',textDecoration:'none'}}>Instagram</a>}
            {brand.facebook&&<a href={`https://facebook.com/${brand.facebook}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'rgba(255,255,255,0.4)',textDecoration:'none'}}>Facebook</a>}
          </div>
          <div style={{fontSize:9,color:'rgba(255,255,255,0.15)',marginTop:8}}>Powered by SAHAR Shop 🇲🇦</div>
        </div>
      </div>

      {/* Live ticker */}
      <LiveTicker orders={liveTicker}/>

      {/* Sticky cart button */}
      {cart.count>0&&!showCart&&(
        <div style={{position:'fixed',bottom:20,right:14,left:14,zIndex:150}}>
          <button onClick={()=>setShowCart(true)} style={{width:'100%',height:50,borderRadius:99,background:'#fff',border:'none',color:'#0A0A0A',fontSize:14,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
            <ShoppingCart size={16}/>
            السلة ({cart.count})
            <span style={{background:'rgba(0,0,0,0.06)',borderRadius:99,padding:'2px 12px',fontSize:13,fontWeight:600}}>{cart.total.toLocaleString()} {cur}</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {viewProduct&&<ProductModal p={viewProduct} cart={cart} onClose={()=>setViewProduct(null)} currency={cur} userId={userId} isNight={isNight}/>}
      {showCart&&<CartSidebar cart={cart} storeInfo={storeInfo!} userId={userId} onClose={()=>setShowCart(false)} onOrderSuccess={id=>{setSuccessOrderId(id);setShowCart(false);}} isNight={isNight}/>}
      {showTrack&&<TrackingModal userId={userId} storeInfo={storeInfo!} onClose={()=>setShowTrack(false)} isNight={isNight}/>}

      {/* Floating chat */}
      <FloatingChat userId={userId} storeInfo={storeInfo!} isNight={isNight}/>
    </div>
  );
}