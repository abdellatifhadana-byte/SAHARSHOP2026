import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, ShoppingCart, X, MessageCircle, Share2, Plus, Minus, Check,
  Package, Star, Heart, Send, Bot, ArrowRight, Play,
  Shield, RefreshCcw, Award, Flame, ChevronUp, Clock, MapPin,
  Filter, SlidersHorizontal, Eye
} from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────
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

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
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

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
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

// ─── HOOKS ────────────────────────────────────────────────────────────────────
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

// ─── DESIGN TOKENS — Neo-Moroccan Luxury Noir ────────────────────────────────
const SF:React.CSSProperties = {
  '--sf-bg':'#080808',
  '--sf-bg2':'#0D0D0D',
  '--sf-surface':'rgba(212,168,83,0.04)',
  '--sf-surface2':'rgba(255,255,255,0.02)',
  '--sf-surface-solid':'#111111',
  '--sf-border':'rgba(212,168,83,0.12)',
  '--sf-border2':'rgba(212,168,83,0.06)',
  '--sf-text':'#F5F0EB',
  '--sf-text2':'rgba(245,240,235,0.72)',
  '--sf-text3':'rgba(245,240,235,0.42)',
  '--sf-primary':'#D4A853',
  '--sf-primary2':'#E0C278',
  '--sf-p10':'rgba(212,168,83,0.10)',
  '--sf-p20':'rgba(212,168,83,0.18)',
  '--sf-purple':'#D4A853',
  '--sf-purple2':'#E0C278',
  '--sf-pu10':'rgba(212,168,83,0.12)',
  '--sf-success':'#0D9488',
  '--sf-s10':'rgba(13,148,136,0.10)',
  '--sf-warning':'#D4A853',
  '--sf-danger':'#DC2626',
  '--sf-glass':'rgba(212,168,83,0.04)',
  '--sf-glass-border':'rgba(212,168,83,0.10)',
  '--sf-shadow':'0 4px 24px rgba(0,0,0,0.4)',
  '--sf-shadow-lg':'0 8px 48px rgba(0,0,0,0.5)',
  '--sf-glow-orange':'0 0 20px rgba(212,168,83,0.15)',
  '--sf-glow-purple':'0 0 20px rgba(212,168,83,0.15)',
} as React.CSSProperties;

// ─── PROMO BAR ────────────────────────────────────────────────────────────────
function PromoBar() {
  const items=['🎉 شحن مجاني للطلبات فوق 200 درهم','🔄 إرجاع سهل خلال 7 أيام','⭐ جودة مضمونة 100%','🚚 توصيل لجميع المدن المغربية','💳 دفع عند الاستلام متاح'];
  return (
    <div style={{background:'linear-gradient(90deg,#D4A853,#E0C278,#D4A853)',backgroundSize:'200% 100%',color:'#080808',height:30,overflow:'hidden',display:'flex',alignItems:'center',fontSize:11,fontWeight:700,animation:'sfgradientshift 6s linear infinite',letterSpacing:'0.02em'}}>
      <style>{`@keyframes sfmarquee{0%{transform:translateX(-50%)}100%{transform:translateX(0%)}}@keyframes sfgradientshift{0%{background-position:0% 0}100%{background-position:200% 0}}`}</style>
      <div style={{display:'flex',gap:48,whiteSpace:'nowrap',animation:'sfmarquee 20s linear infinite',paddingInline:20}}>
        {[...items,...items].map((t,i)=><span key={i} style={{flexShrink:0,opacity:.9}}>{t}</span>)}
      </div>
    </div>
  );
}

// ─── DECORATIVE MOROCCAN PATTERN ─────────────────────────────────────────────
function MoroccanPattern({opacity=0.03}:{opacity?:number}) {
  return (
    <div style={{position:'absolute',inset:0,opacity,pointerEvents:'none',overflow:'hidden'}}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="zellige" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M40 0 L80 40 L40 80 L0 40 Z" fill="none" stroke="#D4A853" strokeWidth="0.4"/>
            <path d="M40 10 L70 40 L40 70 L10 40 Z" fill="none" stroke="#D4A853" strokeWidth="0.3"/>
            <circle cx="40" cy="40" r="15" fill="none" stroke="#D4A853" strokeWidth="0.3"/>
          </pattern>
          <pattern id="stars" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 0 L37 23 L60 30 L37 37 L30 60 L23 37 L0 30 L23 23 Z" fill="none" stroke="#D4A853" strokeWidth="0.25"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#zellige)"/>
        <rect width="100%" height="100%" fill="url(#stars)" opacity="0.5"/>
      </svg>
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
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
    localStorage.setItem('sahar_wishlist',JSON.stringify(liked?wl.filter(x=>x!==p.id):[...wl,p.id]));
    setLiked(!liked);
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
        background:hover?'rgba(212,168,83,0.06)':'rgba(255,255,255,0.02)',
        backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
        borderRadius:4,overflow:'hidden',cursor:'pointer',
        border:`1px solid ${hover?'rgba(212,168,83,0.35)':'rgba(212,168,83,0.08)'}`,
        boxShadow:hover?'0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,168,83,0.15), 0 0 30px rgba(212,168,83,0.06)':'0 4px 20px rgba(0,0,0,0.35)',
        transform:hover?'translateY(-4px)':'none',
        transition:'all .35s cubic-bezier(.25,.1,.25,1)',
        position:'relative',
      }}>
      {/* Image */}
      <div style={{height:220,position:'relative',background:'#0A0A0A',overflow:'hidden'}}>
        {imgs.length>0
          ?<img src={imgs[imgIdx]} alt={p.name} loading="lazy"
              style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .6s cubic-bezier(.25,.1,.25,1)',
                transform:hover?'scale(1.06)':'scale(1)'}}/>
          :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:52,color:'rgba(212,168,83,0.3)'}}>{p.emoji||'📦'}</div>
        }
        {/* Gradient overlay */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(8,8,8,.75) 0%,transparent 55%)',opacity:hover?1:0.35,transition:'opacity .35s'}}/>

        {/* Quick Action Buttons */}
        <div style={{position:'absolute',bottom:12,left:0,right:0,display:'flex',gap:8,justifyContent:'center',
          opacity:hover?1:0,transform:hover?'translateY(0)':'translateY(10px)',transition:'all .3s cubic-bezier(.25,.1,.25,1)',zIndex:2}}>
          <button onClick={e=>{e.stopPropagation();onView(p);}} title="معاينة سريعة"
            style={{width:36,height:36,borderRadius:2,background:'rgba(8,8,8,0.85)',border:'1px solid rgba(212,168,83,0.25)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(12px)',transition:'all .2s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(212,168,83,0.15)';(e.currentTarget as HTMLElement).style.transform='scale(1.08)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(8,8,8,0.85)';(e.currentTarget as HTMLElement).style.transform='';}}>
            <Eye size={14} color="#D4A853"/>
          </button>
          <button onClick={quickAdd} title={p.type==='service'?'احجز':'أضف للسلة'}
            style={{width:36,height:36,borderRadius:2,background:addedFlash?'#0D9488':'#D4A853',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='scale(1.08)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';}}>
            {addedFlash?<Check size={14} color="#fff"/>:<ShoppingCart size={14} color="#080808"/>}
          </button>
          <button onClick={toggleLike} title="مفضلة"
            style={{width:36,height:36,borderRadius:2,background:liked?'rgba(220,38,38,0.15)':'rgba(8,8,8,0.85)',border:`1px solid ${liked?'rgba(220,38,38,0.4)':'rgba(212,168,83,0.25)'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(12px)',transition:'all .2s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='scale(1.08)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';}}>
            <Heart size={14} fill={liked?'#DC2626':'none'} color={liked?'#DC2626':'#D4A853'}/>
          </button>
        </div>

        {/* Badges */}
        <div style={{position:'absolute',top:10,right:10,display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end',zIndex:2}}>
          {p.type==='service'&&<span style={{background:'#D4A853',color:'#080808',fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:2}}>خدمة</span>}
          {p.type==='digital'&&<span style={{background:'#0D9488',color:'#fff',fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:2}}>رقمي</span>}
          {(!p.type||p.type==='product')&&isNew&&<span style={{background:'#D4A853',color:'#080808',fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:2}}>✨ جديد</span>}
          {p.stock<=3&&p.stock>0&&(!p.type||p.type==='product')&&<span style={{background:'rgba(220,38,38,0.12)',color:'#DC2626',fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:2,border:'1px solid rgba(220,38,38,0.25)'}}>⚡ آخر {p.stock}</span>}
          {p.sales>15&&<span style={{background:'rgba(212,168,83,0.12)',color:'#D4A853',fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:2,border:'1px solid rgba(212,168,83,0.25)'}}>🔥 رائج</span>}
          {(!p.type||p.type==='product')&&p.stock===0&&<span style={{background:'rgba(255,255,255,0.04)',color:'rgba(245,240,235,0.4)',fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:2,border:'1px solid rgba(255,255,255,0.08)'}}>نفذ</span>}
        </div>
        {/* Like top-left */}
        <button onClick={toggleLike} style={{position:'absolute',top:10,left:10,width:30,height:30,borderRadius:2,background:'rgba(8,8,8,0.7)',border:'1px solid rgba(212,168,83,0.15)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(8px)',zIndex:2,opacity:hover?0:1,transition:'opacity .25s'}}>
          <Heart size={13} fill={liked?'#DC2626':'none'} color={liked?'#DC2626':'rgba(212,168,83,0.7)'}/>
        </button>
        {/* Image counter dots */}
        {imgs.length>1&&(
          <div style={{position:'absolute',bottom:50,left:'50%',transform:'translateX(-50%)',display:'flex',gap:4,zIndex:2,opacity:hover?0:1,transition:'opacity .25s'}}>
            {imgs.map((_,i)=><div key={i} style={{width:4,height:4,borderRadius:'50%',background:i===imgIdx?'#D4A853':'rgba(255,255,255,0.3)'}}/>)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{padding:'14px 15px 16px'}}>
        <div style={{fontSize:9,color:'rgba(212,168,83,0.5)',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:5}}>{p.category||'—'}</div>
        <div style={{fontSize:13,fontWeight:600,color:'#F5F0EB',marginBottom:6,lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',letterSpacing:'-0.01em'}}>{p.name}</div>
        {reviews>0&&(
          <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:7}}>
            <div style={{display:'flex',gap:1}}>
              {Array.from({length:5},(_,i)=><Star key={i} size={9} fill={i<rating?'#D4A853':'none'} color={i<rating?'#D4A853':'rgba(212,168,83,0.2)'}/>)}
            </div>
            <span style={{fontSize:9,color:'rgba(245,240,235,0.35)'}}>({reviews})</span>
          </div>
        )}
        {/* Sales progress bar */}
        {soldPct>20&&(!p.type||p.type==='product')&&(
          <div style={{marginBottom:9}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
              <span style={{fontSize:8,color:'rgba(245,240,235,0.35)',fontWeight:600}}>تم بيع {soldPct}%</span>
              {p.stock<=10&&p.stock>0&&<span style={{fontSize:8,color:'#DC2626',fontWeight:700}}>متبقي {p.stock}</span>}
            </div>
            <div style={{height:2,background:'rgba(212,168,83,0.1)',borderRadius:0,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${soldPct}%`,background:soldPct>80?'#DC2626':'#D4A853',borderRadius:0,transition:'width .6s'}}/>
            </div>
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}>
          <div style={{fontSize:19,fontWeight:700,color:'#D4A853',letterSpacing:'-0.03em'}}>
            {p.price.toLocaleString()} <span style={{fontSize:10,fontWeight:400,color:'rgba(245,240,235,0.4)'}}>{currency}</span>
          </div>
          {p.sizes?.length>0&&(
            <div style={{display:'flex',gap:3}}>
              {p.sizes.slice(0,3).map(s=><span key={s} style={{fontSize:8,background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.12)',borderRadius:1,padding:'1px 4px',color:'rgba(212,168,83,0.6)',fontWeight:600}}>{s}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────
function ServiceCard({p,onView,currency}:{p:SProduct;onView:(p:SProduct)=>void;currency:string}) {
  const [hover,setHover]=useState(false);
  const TYPE_EMOJI:Record<string,string>={'تصوير':'📸','تصميم':'🎨','تنظيف':'🧹','إصلاح':'🔧','توصيل':'🚚','طبخ':'🍳','تعليم':'📚','صيانة':'⚙️','خياطة':'🧵','حلاقة':'✂️'};
  const emoji=Object.entries(TYPE_EMOJI).find(([k])=>p.name.includes(k)||p.category?.includes(k))?.[1]||p.emoji||'🛠️';

  return (
    <div onClick={()=>onView(p)}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        background:hover?'rgba(212,168,83,0.05)':'rgba(255,255,255,0.02)',
        backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
        borderRadius:4,padding:'18px',cursor:'pointer',
        border:`1px solid ${hover?'rgba(212,168,83,0.3)':'rgba(212,168,83,0.08)'}`,
        borderRight:`3px solid ${hover?'#D4A853':'rgba(212,168,83,0.3)'}`,
        boxShadow:hover?'0 12px 40px rgba(0,0,0,0.45), 0 0 20px rgba(212,168,83,0.08)':'0 4px 16px rgba(0,0,0,0.3)',
        transform:hover?'translateX(-2px)':'none',
        transition:'all .3s cubic-bezier(.25,.1,.25,1)',
        display:'flex',gap:16,alignItems:'flex-start',
      }}>
      {/* Icon square */}
      <div style={{flexShrink:0,width:68,height:68,borderRadius:2,
        background:hover?'#D4A853':'rgba(212,168,83,0.12)',
        border:`1px solid ${hover?'transparent':'rgba(212,168,83,0.2)'}`,
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,
        transition:'all .3s',overflow:'hidden',
      }}>
        {p.imageUrl
          ?<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          :<span style={{color:hover?'#080808':'#D4A853'}}>{emoji}</span>
        }
      </div>
      {/* Content */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:6}}>
          <div style={{fontSize:14,fontWeight:700,color:'#F5F0EB',lineHeight:1.3,flex:1}}>{p.name}</div>
          <div style={{fontSize:16,fontWeight:700,color:'#D4A853',flexShrink:0,letterSpacing:'-0.02em'}}>
            {p.price.toLocaleString()} <span style={{fontSize:9,fontWeight:400,color:'rgba(245,240,235,0.4)'}}>{currency}</span>
          </div>
        </div>
        {p.description&&<div style={{fontSize:11,color:'rgba(245,240,235,0.5)',lineHeight:1.6,marginBottom:10,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{p.description}</div>}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {p.duration&&<span style={{display:'flex',alignItems:'center',gap:3,fontSize:10,color:'rgba(212,168,83,0.6)',background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.12)',borderRadius:2,padding:'3px 8px'}}><Clock size={9}/> {p.duration}</span>}
            {p.workArea&&<span style={{display:'flex',alignItems:'center',gap:3,fontSize:10,color:'rgba(212,168,83,0.6)',background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.12)',borderRadius:2,padding:'3px 8px'}}><MapPin size={9}/> {p.workArea}</span>}
            {p.sales>0&&<span style={{fontSize:10,color:'rgba(245,240,235,0.35)'}}>{p.sales} طلب</span>}
          </div>
          <button onClick={e=>{e.stopPropagation();onView(p);}}
            style={{flexShrink:0,padding:'7px 18px',borderRadius:2,background:hover?'#D4A853':'rgba(212,168,83,0.12)',border:`1px solid ${hover?'transparent':'rgba(212,168,83,0.2)'}`,color:hover?'#080808':'#D4A853',fontSize:11,fontWeight:700,cursor:'pointer',transition:'all .2s'}}>
            احجز الآن
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LIGHTBOX ─────────────────────────────────────────────────────────────────
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
    <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,.98)',display:'flex',alignItems:'center',justifyContent:'center',touchAction:'none'}} onClick={onClose}>
      <button onClick={onClose} style={{position:'absolute',top:16,left:16,width:40,height:40,borderRadius:2,background:'rgba(212,168,83,0.08)',backdropFilter:'blur(12px)',border:'1px solid rgba(212,168,83,0.2)',color:'#D4A853',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3}}><X size={20}/></button>
      <div style={{position:'absolute',top:22,right:20,color:'rgba(212,168,83,0.5)',fontSize:13,fontWeight:600,zIndex:3}}>{idx+1}/{images.length}</div>
      <div onClick={e=>{e.stopPropagation();setZoom(z=>z>1?1:2.5);setPan({x:0,y:0});}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        <img src={images[idx]} alt="" draggable={false} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transition:touch.current?'none':'transform .2s',cursor:zoom>1?'grab':'zoom-in',userSelect:'none'}}/>
      </div>
      {images.length>1&&<>
        <button onClick={e=>{e.stopPropagation();go(1);}} disabled={idx>=images.length-1} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:2,background:'rgba(212,168,83,0.08)',backdropFilter:'blur(12px)',border:'1px solid rgba(212,168,83,0.2)',color:'#D4A853',cursor:'pointer',fontSize:22,zIndex:3,opacity:idx>=images.length-1?.3:1}}>‹</button>
        <button onClick={e=>{e.stopPropagation();go(-1);}} disabled={idx<=0} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:2,background:'rgba(212,168,83,0.08)',backdropFilter:'blur(12px)',border:'1px solid rgba(212,168,83,0.2)',color:'#D4A853',cursor:'pointer',fontSize:22,zIndex:3,opacity:idx<=0?.3:1}}>›</button>
      </>}
      {images.length>1&&(
        <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:16,left:0,right:0,display:'flex',gap:6,justifyContent:'center',overflowX:'auto',padding:'0 16px',zIndex:3}}>
          {images.map((img,i)=>(
            <button key={i} onClick={()=>{setIdx(i);setZoom(1);setPan({x:0,y:0});}} style={{flexShrink:0,width:48,height:48,borderRadius:2,overflow:'hidden',border:`2px solid ${i===idx?'#D4A853':'rgba(212,168,83,0.2)'}`,padding:0,cursor:'pointer',background:'#000',boxShadow:i===idx?'0 0 12px rgba(212,168,83,0.3)':'none'}}>
              <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────
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

  const glassInput:React.CSSProperties={background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.15)',color:'#F5F0EB',borderRadius:2,padding:'8px 12px',fontSize:13,outline:'none',fontFamily:'Tajawal,sans-serif',boxSizing:'border-box' as any};

  return (<>
    {lightboxIdx!==null&&galleryImgs.length>0&&<Lightbox images={galleryImgs} startIndex={lightboxIdx} onClose={()=>setLightboxIdx(null)}/>}
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(12px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'linear-gradient(180deg,#111111 0%,#0A0A0A 100%)',
        border:'1px solid rgba(212,168,83,0.1)',
        borderRadius:'4px 4px 0 0',width:'100%',maxWidth:520,
        maxHeight:'93vh',overflowY:'auto',
        boxShadow:'0 -8px 60px rgba(0,0,0,0.7)',
      }}>
        {/* Image */}
        <div style={{height:280,position:'relative',background:'#080808',flexShrink:0,overflow:'hidden'}}>
          {showVideo&&p.videoUrl
            ?<video src={p.videoUrl} controls autoPlay playsInline style={{width:'100%',height:'100%',objectFit:'contain',background:'#000'}}/>
            :activeImage
            ?<img src={activeImage} alt={p.name} onClick={()=>{const i=galleryImgs.indexOf(activeImage);setLightboxIdx(i>=0?i:0);}}
                style={{width:'100%',height:'100%',objectFit:'cover',cursor:'zoom-in'}}/>
            :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80,color:'rgba(212,168,83,0.2)'}}>{p.emoji||'📦'}</div>
          }
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(8,8,8,.85) 0%,transparent 50%)',pointerEvents:'none'}}/>
          <button onClick={onClose} style={{position:'absolute',top:14,left:14,width:36,height:36,borderRadius:2,background:'rgba(8,8,8,0.7)',backdropFilter:'blur(12px)',border:'1px solid rgba(212,168,83,0.2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}><X size={16} color="#D4A853"/></button>
          <button onClick={share} style={{position:'absolute',top:14,right:14,width:36,height:36,borderRadius:2,background:'rgba(8,8,8,0.7)',backdropFilter:'blur(12px)',border:'1px solid rgba(212,168,83,0.2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}><Share2 size={15} color="#D4A853"/></button>
          {p.sales>0&&!showVideo&&<div style={{position:'absolute',bottom:12,right:12,background:'#D4A853',color:'#080808',fontSize:11,fontWeight:700,padding:'4px 11px',borderRadius:2}}>{p.sales}+ مبيعة</div>}
        </div>

        {/* Thumbnails */}
        {(galleryImgs.length>1||p.videoUrl)&&(
          <div style={{display:'flex',gap:6,overflowX:'auto',padding:'10px 14px',background:'rgba(0,0,0,0.3)',borderBottom:'1px solid rgba(212,168,83,0.08)'}}>
            {galleryImgs.map((img,i)=>(
              <button key={i} onClick={()=>{setShowVideo(false);setActiveImage(img);}} style={{flexShrink:0,width:52,height:52,borderRadius:2,overflow:'hidden',border:`1.5px solid ${!showVideo&&activeImage===img?'#D4A853':'rgba(212,168,83,0.15)'}`,background:'#080808',cursor:'pointer',padding:0,boxShadow:!showVideo&&activeImage===img?'0 0 10px rgba(212,168,83,0.25)':'none'}}>
                <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </button>
            ))}
            {p.videoUrl&&(
              <button onClick={()=>setShowVideo(true)} style={{flexShrink:0,width:52,height:52,borderRadius:2,border:`1.5px solid ${showVideo?'#D4A853':'rgba(212,168,83,0.15)'}`,background:'#080808',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Play size={18} color="#D4A853"/>
              </button>
            )}
          </div>
        )}

        <div style={{padding:'20px 20px 0'}}>
          <div style={{fontSize:10,color:'rgba(212,168,83,0.5)',marginBottom:4,fontWeight:600,letterSpacing:'.06em'}}>{p.category}{p.sku?` · #${p.sku}`:''}</div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#F5F0EB',margin:'0 0 10px',lineHeight:1.3}}>{p.name}</h2>
          {/* Rating */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:16}}>
            <div style={{display:'flex',gap:1}}>{Array.from({length:5},(_,i)=><Star key={i} size={12} fill={i<rating?'#D4A853':'none'} color={i<rating?'#D4A853':'rgba(212,168,83,0.15)'}/>)}</div>
            <span style={{fontSize:11,color:'rgba(245,240,235,0.35)'}}>({Math.min(p.sales*2,120)}) · {p.sales} طلب</span>
          </div>
          {/* Trust badges */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
            {[{icon:<Shield size={10}/>,t:'دفع آمن',g:'#D4A853'},{icon:<RefreshCcw size={10}/>,t:'إرجاع 7 أيام',g:'#D4A853'},{icon:<Package size={10}/>,t:'توصيل سريع',g:'#D4A853'},{icon:<Award size={10}/>,t:'جودة مضمونة',g:'#D4A853'}].map(b=>(
              <div key={b.t} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:2,background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.1)',color:b.g,fontSize:10,fontWeight:600}}>{b.icon}{b.t}</div>
            ))}
          </div>
          {/* Social proof */}
          {p.sales>0&&(
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:14,padding:'10px 14px',background:'rgba(212,168,83,0.04)',borderRadius:2,border:'1px solid rgba(212,168,83,0.1)'}}>
              <Flame size={14} color="#D4A853"/>
              <span style={{fontSize:12,color:'rgba(245,240,235,0.7)'}}><strong style={{color:'#D4A853'}}>{p.sales}</strong> شخص طلب هذا{p.sales>=10?<span style={{color:'#0D9488',marginRight:4}}> · مشهور جداً</span>:''}</span>
            </div>
          )}
          {/* Price + viewers */}
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:14}}>
            <div style={{fontSize:30,fontWeight:700,color:'#D4A853',letterSpacing:'-0.04em'}}>{p.price.toLocaleString()} <span style={{fontSize:14,color:'rgba(245,240,235,0.4)',fontWeight:400}}>{currency}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.15)',borderRadius:2,padding:'5px 11px'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#D4A853',display:'inline-block',animation:'sfpulse 1.5s ease infinite'}}/>
              <span style={{fontSize:10,fontWeight:600,color:'#D4A853'}}>{viewersNow} يشاهدونه الآن</span>
            </div>
          </div>
          {/* Sales progress */}
          {soldPct>15&&(!p.type||p.type==='product')&&(
            <div style={{marginBottom:16,padding:'12px 14px',background:'rgba(212,168,83,0.03)',borderRadius:2,border:'1px solid rgba(212,168,83,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:600,color:'rgba(245,240,235,0.6)'}}>🔥 تم بيع <strong style={{color:'#D4A853'}}>{soldPct}%</strong></span>
                {p.stock<=10&&p.stock>0&&<span style={{fontSize:11,color:'#DC2626',fontWeight:700}}>متبقي {p.stock}!</span>}
              </div>
              <div style={{height:3,background:'rgba(212,168,83,0.08)',borderRadius:0,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${soldPct}%`,background:soldPct>80?'#DC2626':'#D4A853',borderRadius:0}}/>
              </div>
            </div>
          )}
          {p.description&&<p style={{fontSize:13,color:'rgba(245,240,235,0.55)',lineHeight:1.8,marginBottom:16}}>{p.description}</p>}
          {/* Custom fields */}
          {p.customFields&&p.customFields.filter(f=>f.value).length>0&&(
            <div style={{marginBottom:16,padding:'12px 14px',background:'rgba(212,168,83,0.03)',borderRadius:2,border:'1px solid rgba(212,168,83,0.08)',display:'flex',flexDirection:'column',gap:6}}>
              {p.customFields.filter(f=>f.value).map(f=>(
                <div key={f.id} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'rgba(245,240,235,0.4)',fontWeight:500}}>{f.label}</span>
                  <span style={{color:'rgba(245,240,235,0.75)',fontWeight:600}}>{f.value}</span>
                </div>
              ))}
            </div>
          )}
          {/* Service meta */}
          {p.type==='service'&&(p.duration||p.workArea)&&(
            <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
              {p.duration&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'rgba(212,168,83,0.6)',background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.1)',borderRadius:2,padding:'5px 12px'}}><Clock size={10}/> {p.duration}</span>}
              {p.workArea&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'rgba(212,168,83,0.6)',background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.1)',borderRadius:2,padding:'5px 12px'}}><MapPin size={10}/> {p.workArea}</span>}
            </div>
          )}
          {p.type==='digital'&&<div style={{marginBottom:16,padding:'10px 14px',background:'rgba(13,148,136,0.06)',border:'1px solid rgba(13,148,136,0.2)',borderRadius:2,fontSize:12,color:'#0D9488'}}>💻 منتج رقمي — سيُرسل إليك مباشرة بعد التأكيد</div>}
          {/* Sizes */}
          {(!p.type||p.type==='product')&&p.sizes?.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:600,color:'rgba(245,240,235,0.35)',marginBottom:8,letterSpacing:'.05em'}}>المقاس</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {p.sizes.map(s=>(
                  <button key={s} onClick={()=>setSize(s)} style={{padding:'7px 16px',borderRadius:2,border:`1.5px solid ${size===s?'#D4A853':'rgba(212,168,83,0.12)'}`,background:size===s?'rgba(212,168,83,0.1)':'rgba(212,168,83,0.02)',color:size===s?'#D4A853':'rgba(245,240,235,0.55)',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all .15s'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Colors */}
          {p.colors?.length>0&&(
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:600,color:'rgba(245,240,235,0.35)',marginBottom:8,letterSpacing:'.05em'}}>اللون: <span style={{color:'rgba(245,240,235,0.7)'}}>{color}</span></div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {p.colors.map(clr=>{
                  const colorImg=p.colorImages?.[clr];
                  const CM:Record<string,string>={'أسود':'#1a1a1a','أبيض':'#f5f5f5','أحمر':'#dc2626','أزرق':'#3b82f6','أخضر':'#0d9488','رمادي':'#6b7280','بيج':'#d4b896','وردي':'#f472b6','بني':'#92400e','كحلي':'#1e3a5f','بنفسجي':'#a855f7','برتقالي':'#f97316'};
                  return colorImg?(
                    <button key={clr} onClick={()=>{setColor(clr);setActiveImage(colorImg||p.imageUrl||'');}} style={{padding:3,borderRadius:2,border:`2px solid ${color===clr?'#D4A853':'rgba(212,168,83,0.15)'}`,cursor:'pointer',background:'transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                      <img src={colorImg} alt={clr} style={{width:48,height:48,objectFit:'cover',borderRadius:1}}/>
                      <span style={{fontSize:9,fontWeight:600,color:color===clr?'#D4A853':'rgba(245,240,235,0.4)'}}>{clr}</span>
                    </button>
                  ):(
                    <button key={clr} onClick={()=>setColor(clr)} style={{width:28,height:28,borderRadius:2,background:CM[clr]||'#ccc',border:`3px solid ${color===clr?'#D4A853':'rgba(212,168,83,0.2)'}`,cursor:'pointer',transition:'all .15s'}} title={clr}/>
                  );
                })}
              </div>
            </div>
          )}
          {/* Related products */}
          {p.category&&(window as any).__sfProducts?.filter((rp:any)=>rp.id!==p.id&&rp.category===p.category).length>0&&(
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,fontWeight:600,color:'rgba(245,240,235,0.35)',marginBottom:10,letterSpacing:'.06em'}}>🛍️ قد يعجبك أيضاً</div>
              <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
                {(window as any).__sfProducts.filter((rp:any)=>rp.id!==p.id&&rp.category===p.category).slice(0,4).map((rp:any)=>(
                  <div key={rp.id} onClick={()=>{onClose();setTimeout(()=>document.dispatchEvent(new CustomEvent('viewProduct',{detail:rp})),50);}}
                    style={{flexShrink:0,width:90,borderRadius:2,overflow:'hidden',cursor:'pointer',background:'rgba(212,168,83,0.03)',border:'1px solid rgba(212,168,83,0.08)'}}>
                    <div style={{height:72,background:'#080808',overflow:'hidden'}}>
                      {rp.imageUrl?<img src={rp.imageUrl} alt={rp.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{rp.emoji||'📦'}</div>}
                    </div>
                    <div style={{padding:'6px 8px'}}>
                      <div style={{fontSize:10,fontWeight:600,color:'rgba(245,240,235,0.7)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{rp.name}</div>
                      <div style={{fontSize:11,fontWeight:700,color:'#D4A853'}}>{rp.price.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Qty */}
          {(!p.type||p.type==='product')&&(
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
              <span style={{fontSize:10,fontWeight:600,color:'rgba(245,240,235,0.35)'}}>الكمية</span>
              <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(212,168,83,0.04)',borderRadius:2,padding:'4px 8px',border:'1px solid rgba(212,168,83,0.12)'}}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:30,height:30,borderRadius:2,...glassInput,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}><Minus size={12}/></button>
                <span style={{fontSize:14,fontWeight:600,color:'#F5F0EB',minWidth:24,textAlign:'center'}}>{qty}</span>
                <button onClick={()=>setQty(q=>Math.min(p.stock||99,q+1))} style={{width:30,height:30,borderRadius:2,...glassInput,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}><Plus size={12}/></button>
              </div>
              {(!p.type||p.type==='product')&&<span style={{fontSize:10,color:'rgba(245,240,235,0.3)'}}>{p.stock} متوفر</span>}
            </div>
          )}
        </div>
        {/* Sticky CTA */}
        <div style={{padding:'12px 20px 30px',background:'rgba(8,8,8,0.95)',borderTop:'1px solid rgba(212,168,83,0.08)',marginTop:4,backdropFilter:'blur(12px)'}}>
          <button onClick={handleAdd} style={{
            width:'100%',height:54,
            background:added?'#0D9488':'#D4A853',
            border:'none',color:added?'#fff':'#080808',fontSize:14,fontWeight:700,
            cursor:'pointer',transition:'all .25s cubic-bezier(.25,.1,.25,1)',
            display:'flex',alignItems:'center',justifyContent:'center',gap:8,
            borderRadius:2,
            boxShadow:added?'0 4px 20px rgba(13,148,136,0.3)':'0 4px 20px rgba(212,168,83,0.25)',
          }}>
            {added?<><Check size={18}/>{p.type==='service'?'تم الحجز!':'تمت الإضافة!'}</>
              :<><ShoppingCart size={16}/>{p.type==='service'?'احجز الآن':p.type==='digital'?'اشتر الآن':'أضف للسلة'} — {(p.price*qty).toLocaleString()} {currency}</>}
          </button>
        </div>
      </div>
    </div>
  </>);
}

// ─── CART SIDEBAR ─────────────────────────────────────────────────────────────
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

  const inp:React.CSSProperties={width:'100%',padding:'10px 14px',borderRadius:2,border:'1px solid rgba(212,168,83,0.12)',background:'rgba(212,168,83,0.03)',color:'#F5F0EB',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'Tajawal,sans-serif',backdropFilter:'blur(8px)'};

  return (
    <div style={{position:'fixed',inset:0,zIndex:400,display:'flex'}}>
      <div onClick={onClose} style={{flex:1,background:'rgba(0,0,0,.65)',backdropFilter:'blur(8px)'}}/>
      <div style={{width:'min(420px,100vw)',background:'linear-gradient(180deg,#111111 0%,#0A0A0A 100%)',display:'flex',flexDirection:'column',overflowY:'auto',boxShadow:'-8px 0 60px rgba(0,0,0,0.7)',borderLeft:'1px solid rgba(212,168,83,0.08)'}}>
        <div style={{padding:'18px 20px',borderBottom:'1px solid rgba(212,168,83,0.08)',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:2,background:'rgba(8,8,8,0.95)',backdropFilter:'blur(20px)'}}>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:2,background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.12)',cursor:'pointer',color:'#D4A853',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={15}/></button>
          <div style={{flex:1,fontSize:15,fontWeight:700,color:'#F5F0EB'}}>{step==='cart'?`سلتك (${cart.count})`:step==='checkout'?'تأكيد الطلب':'تم الطلب ✅'}</div>
          {step==='cart'&&<span style={{fontSize:14,fontWeight:700,color:'#D4A853'}}>{cart.total.toLocaleString()} {cur}</span>}
        </div>

        {step==='cart'&&(
          <div style={{flex:1,overflow:'auto',padding:16}}>
            {cart.items.length===0?(
              <div style={{textAlign:'center',padding:'60px 20px',color:'rgba(245,240,235,0.3)'}}>
                <ShoppingCart size={44} style={{margin:'0 auto 14px',opacity:.15,color:'#D4A853'}}/>
                <div style={{fontSize:15,fontWeight:600,color:'rgba(245,240,235,0.5)',marginBottom:6}}>سلتك فارغة</div>
                <button onClick={onClose} style={{marginTop:12,padding:'9px 24px',background:'#D4A853',border:'none',borderRadius:2,color:'#080808',cursor:'pointer',fontWeight:700,fontSize:13}}>تصفح المنتجات</button>
              </div>
            ):(
              <>
                {cart.items.map((item,i)=>(
                  <div key={i} style={{display:'flex',gap:12,padding:'14px 0',borderBottom:'1px solid rgba(212,168,83,0.06)'}}>
                    <div style={{width:64,height:64,borderRadius:2,background:'#080808',overflow:'hidden',flexShrink:0,border:'1px solid rgba(212,168,83,0.1)'}}>
                      {item.product.imageUrl?<img src={item.product.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,color:'rgba(212,168,83,0.2)'}}>{item.product.emoji||'📦'}</div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#F5F0EB'}}>{item.product.name}</div>
                      <div style={{fontSize:10,color:'rgba(245,240,235,0.3)',marginTop:2}}>{item.size&&`${item.size}`}{item.color&&` · ${item.color}`}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(212,168,83,0.03)',borderRadius:2,padding:'3px 6px',border:'1px solid rgba(212,168,83,0.1)'}}>
                          <button onClick={()=>cart.update(item.product.id,item.size,item.color,item.quantity-1)} style={{width:24,height:24,borderRadius:1,background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.12)',cursor:'pointer',color:'#D4A853',display:'flex',alignItems:'center',justifyContent:'center'}}><Minus size={10}/></button>
                          <span style={{fontSize:13,fontWeight:600,color:'#F5F0EB',minWidth:20,textAlign:'center'}}>{item.quantity}</span>
                          <button onClick={()=>cart.update(item.product.id,item.size,item.color,item.quantity+1)} style={{width:24,height:24,borderRadius:1,background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.12)',cursor:'pointer',color:'#D4A853',display:'flex',alignItems:'center',justifyContent:'center'}}><Plus size={10}/></button>
                        </div>
                        <span style={{fontSize:14,fontWeight:700,color:'#D4A853'}}>{(item.product.price*item.quantity).toLocaleString()} {cur}</span>
                      </div>
                    </div>
                    <button onClick={()=>cart.remove(item.product.id,item.size,item.color)} style={{width:26,height:26,borderRadius:2,background:'rgba(220,38,38,0.08)',border:'1px solid rgba(220,38,38,0.2)',cursor:'pointer',color:'#DC2626',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}><X size={12}/></button>
                  </div>
                ))}
                <div style={{padding:'16px 0',marginTop:8}}>
                  <button onClick={()=>setStep('checkout')} style={{width:'100%',height:52,background:'#D4A853',border:'none',borderRadius:2,color:'#080808',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 20px rgba(212,168,83,0.25)'}}>
                    متابعة الطلب <ArrowRight size={16}/>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step==='checkout'&&(
          <div style={{flex:1,overflow:'auto',padding:'18px 20px',display:'flex',flexDirection:'column',gap:10}}>
            <input style={inp} placeholder="الاسم الكامل *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            <input style={inp} placeholder="رقم الهاتف *" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} dir="ltr" type="tel"/>
            <div style={{position:'relative'}}>
              <input style={inp} placeholder="المدينة *" value={citySearch||form.city} onChange={e=>{setCitySearch(e.target.value);setShowCities(true);setForm(f=>({...f,city:e.target.value}));}} onFocus={()=>setShowCities(true)} onBlur={()=>setTimeout(()=>setShowCities(false),200)}/>
              {showCities&&filteredCities.length>0&&(
                <div style={{position:'absolute',top:'100%',right:0,left:0,background:'#111111',border:'1px solid rgba(212,168,83,0.12)',borderRadius:2,maxHeight:180,overflowY:'auto',zIndex:10,marginTop:4,boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>
                  {filteredCities.map(city=>(
                    <div key={city} onClick={()=>{setForm(f=>({...f,city}));setCitySearch(city);setShowCities(false);}} style={{padding:'10px 14px',fontSize:13,color:'rgba(245,240,235,0.7)',cursor:'pointer',borderBottom:'1px solid rgba(212,168,83,0.06)'}} onMouseOver={e=>(e.currentTarget.style.background='rgba(212,168,83,0.05)')} onMouseOut={e=>(e.currentTarget.style.background='')}>{city}</div>
                  ))}
                </div>
              )}
            </div>
            <textarea style={{...inp,resize:'none'} as any} placeholder="العنوان بالتفصيل" rows={2} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/>
            <textarea style={{...inp,resize:'none'} as any} placeholder="ملاحظة للبائع (اختياري)" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(245,240,235,0.35)',marginBottom:8,letterSpacing:'.04em'}}>💳 طريقة الدفع</div>
              <div style={{display:'flex',gap:8}}>
                {[['cod','💵 عند الاستلام'],['virement','🏦 تحويل بنكي']].map(([v,l])=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,paymentMethod:v as any}))} style={{flex:1,padding:'10px',borderRadius:2,border:`1.5px solid ${form.paymentMethod===v?'#D4A853':'rgba(212,168,83,0.12)'}`,background:form.paymentMethod===v?'rgba(212,168,83,0.08)':'rgba(212,168,83,0.02)',color:form.paymentMethod===v?'#D4A853':'rgba(245,240,235,0.5)',fontSize:12,fontWeight:600,cursor:'pointer'}}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(245,240,235,0.35)',marginBottom:8,letterSpacing:'.04em'}}>🏷️ كود الخصم</div>
              <div style={{display:'flex',gap:8}}>
                <input style={{...inp,flex:1,textTransform:'uppercase'}} placeholder="أدخل كود الخصم" value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setCouponMsg('');}} dir="ltr"/>
                <button onClick={applyCoupon} style={{padding:'0 14px',borderRadius:2,background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.12)',color:'#D4A853',fontSize:12,fontWeight:600,cursor:'pointer',flexShrink:0}}>تطبيق</button>
              </div>
              {couponMsg&&<div style={{fontSize:10,marginTop:4,color:couponDiscount>0?'#0D9488':'#DC2626',fontWeight:600}}>{couponMsg}</div>}
            </div>
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13,color:'rgba(245,240,235,0.5)'}}>
              <input type="checkbox" checked={form.subscribe} onChange={e=>setForm(f=>({...f,subscribe:e.target.checked}))} style={{accentColor:'#D4A853',width:16,height:16}}/>
              أريد استقبال العروض عبر واتساب
            </label>
            <div style={{background:'rgba(212,168,83,0.03)',borderRadius:2,padding:'16px',border:'1px solid rgba(212,168,83,0.08)'}}>
              <div style={{fontSize:11,fontWeight:600,color:'rgba(245,240,235,0.35)',marginBottom:10,letterSpacing:'.04em'}}>ملخص الطلب</div>
              {cart.items.map((item,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(245,240,235,0.5)',marginBottom:5,gap:8}}>
                  <span style={{flex:1}}>{item.product.name}{item.size?` (${item.size})`:''} ×{item.quantity}</span>
                  <span style={{flexShrink:0,fontWeight:600,color:'rgba(245,240,235,0.7)'}}>{(item.product.price*item.quantity).toLocaleString()} {cur}</span>
                </div>
              ))}
              <div style={{paddingTop:10,borderTop:'1px solid rgba(212,168,83,0.08)',marginTop:10,display:'flex',flexDirection:'column',gap:5}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(245,240,235,0.45)'}}><span>المجموع</span><span>{cart.total.toLocaleString()} {cur}</span></div>
                {couponDiscount>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#0D9488',fontWeight:600}}><span>🏷️ الخصم</span><span>-{couponDiscount.toLocaleString()} {cur}</span></div>}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(245,240,235,0.45)'}}><span>🚚 التوصيل — {form.city||'—'}</span><span>{form.city?`${deliveryCost} ${cur}`:'بعد المدينة'}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:700,color:'#F5F0EB',paddingTop:10,marginTop:4,borderTop:'1px solid rgba(212,168,83,0.08)'}}><span>الإجمالي</span><span style={{color:'#D4A853'}}>{grandTotal.toLocaleString()} {cur}</span></div>
              </div>
            </div>
            <button onClick={handleOrder} disabled={loading} style={{width:'100%',height:52,background:'#0D9488',border:'none',borderRadius:2,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 20px rgba(13,148,136,0.25)',opacity:loading?.7:1}}>
              {loading?'⟳ جارٍ إرسال الطلب...':<><MessageCircle size={16}/> تأكيد الطلب عبر واتساب</>}
            </button>
            <button onClick={()=>setStep('cart')} style={{background:'none',border:'none',color:'rgba(245,240,235,0.3)',cursor:'pointer',fontSize:13,padding:'4px',textAlign:'center'}}>← رجوع للسلة</button>
          </div>
        )}

        {step==='success'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:2,background:'rgba(13,148,136,0.08)',border:'1.5px solid #0D9488',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,boxShadow:'0 0 30px rgba(13,148,136,0.15)'}}>
              <Check size={36} color="#0D9488"/>
            </div>
            <h2 style={{fontSize:22,fontWeight:700,color:'#F5F0EB',marginBottom:10}}>تم إرسال طلبك! 🎉</h2>
            <p style={{fontSize:13,color:'rgba(245,240,235,0.5)',lineHeight:1.7,marginBottom:24}}>تم إرسال تفاصيل طلبك عبر واتساب.<br/>سيتواصل معك البائع لتأكيد الطلب.</p>
            {orderId&&<div style={{fontSize:11,color:'rgba(245,240,235,0.3)',background:'rgba(212,168,83,0.03)',borderRadius:2,padding:'6px 14px',marginBottom:20,border:'1px solid rgba(212,168,83,0.08)'}}>رقم الطلب: {orderId}</div>}
            <button onClick={onClose} style={{padding:'11px 28px',background:'#D4A853',border:'none',borderRadius:2,color:'#080808',fontSize:14,fontWeight:700,cursor:'pointer'}}>متابعة التسوق</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TRACKING MODAL ───────────────────────────────────────────────────────────
function TrackingModal({userId,storeInfo,onClose}:{userId:string;storeInfo:StoreInfo;onClose:()=>void}) {
  const [query,setQuery]=useState('');
  const [mode,setMode]=useState<'phone'|'code'>('code');
  const [orders,setOrders]=useState<any[]>([]);
  const [singleOrder,setSingleOrder]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [searched,setSearched]=useState(false);
  const cur=storeInfo.brand.currency||'MAD';
  const STATUS_AR:Record<string,string>={pending:'⏳ بانتظار التأكيد',approved:'✅ تم التأكيد',processing:'⚙️ جارٍ التحضير',shipped:'🚚 في الطريق',delivered:'📦 وصل',cancelled:'❌ ملغي'};
  const STATUS_COLOR:Record<string,string>={pending:'#D4A853',approved:'#0D9488',processing:'#D4A853',shipped:'#0D9488',delivered:'#0D9488',cancelled:'#DC2626'};

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
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(12px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'linear-gradient(180deg,#111111 0%,#0A0A0A 100%)',border:'1px solid rgba(212,168,83,0.1)',borderRadius:4,width:'100%',maxWidth:440,padding:24,boxShadow:'0 16px 60px rgba(0,0,0,0.7)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:700,color:'#F5F0EB'}}>📦 تتبع طلبك</h2>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:2,background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.12)',cursor:'pointer',color:'#D4A853',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:12}}>
          {[['code','🔑 كود التتبع'],['phone','📱 رقم الهاتف']].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m as any);setQuery('');setSearched(false);setSingleOrder(null);setOrders([]);}} style={{flex:1,padding:'8px',borderRadius:2,border:`1.5px solid ${mode===m?'#D4A853':'rgba(212,168,83,0.12)'}`,background:mode===m?'rgba(212,168,83,0.08)':'rgba(212,168,83,0.02)',color:mode===m?'#D4A853':'rgba(245,240,235,0.4)',fontSize:12,fontWeight:600,cursor:'pointer'}}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <input placeholder={mode==='code'?'أدخل كودك مثل: AB12CD':'أدخل رقم هاتفك'} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} dir="ltr"
            style={{flex:1,padding:'10px 14px',borderRadius:2,border:'1px solid rgba(212,168,83,0.12)',background:'rgba(212,168,83,0.03)',color:'#F5F0EB',fontSize:13,outline:'none',textTransform:mode==='code'?'uppercase':'none',fontFamily:'Tajawal,sans-serif'}}/>
          <button onClick={search} disabled={loading} style={{padding:'8px 18px',background:'#D4A853',border:'none',borderRadius:2,color:'#080808',fontWeight:700,cursor:'pointer',fontSize:14,flexShrink:0}}>{loading?'⟳':'بحث'}</button>
        </div>
        {searched&&!singleOrder&&orders.length===0&&<p style={{color:'rgba(245,240,235,0.3)',textAlign:'center',fontSize:13,padding:'12px 0'}}>لم نجد طلبات</p>}
        {singleOrder&&(
          <div style={{background:'rgba(13,148,136,0.04)',border:'1px solid rgba(13,148,136,0.2)',borderRadius:2,padding:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:14,fontWeight:700,color:'#F5F0EB'}}>طلبك</span>
              <span style={{fontSize:12,fontWeight:700,color:STATUS_COLOR[singleOrder.status]||'rgba(245,240,235,0.6)'}}>{STATUS_AR[singleOrder.status]||singleOrder.status}</span>
            </div>
            {(singleOrder.items||[]).map((item:any,i:number)=><div key={i} style={{fontSize:11,color:'rgba(245,240,235,0.5)',marginBottom:3}}>• {item.productName} × {item.quantity}</div>)}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8,paddingTop:8,borderTop:'1px solid rgba(13,148,136,0.15)'}}>
              <span style={{fontSize:10,color:'rgba(245,240,235,0.3)'}}>{singleOrder.city}</span>
              <span style={{fontSize:14,fontWeight:700,color:'#D4A853'}}>{singleOrder.total} {cur}</span>
            </div>
          </div>
        )}
        {orders.map((o:any)=>(
          <div key={o.id} style={{background:'rgba(212,168,83,0.03)',borderRadius:2,padding:'12px 14px',marginBottom:8,border:'1px solid rgba(212,168,83,0.08)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontSize:9,color:'rgba(245,240,235,0.25)',fontFamily:'monospace'}}>{o.id}</span>
              <span style={{fontSize:11,fontWeight:600,color:STATUS_COLOR[o.status]||'rgba(245,240,235,0.5)'}}>{STATUS_AR[o.status]||o.status}</span>
            </div>
            {(o.items||[]).map((item:any,i:number)=><div key={i} style={{fontSize:11,color:'rgba(245,240,235,0.45)',marginBottom:2}}>• {item.productName} x{item.quantity}</div>)}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:11}}>
              <span style={{color:'rgba(245,240,235,0.3)'}}>{new Date(o.createdAt).toLocaleDateString('ar-MA')}</span>
              <span style={{fontWeight:700,color:'#D4A853'}}>{o.total} {cur}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FLOATING CHAT ────────────────────────────────────────────────────────────
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
    <button onClick={()=>setOpen(v=>!v)} style={{width:52,height:52,borderRadius:2,background:'#D4A853',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 20px rgba(212,168,83,0.35)',position:'fixed',bottom:28,left:20,zIndex:200,color:'#080808',transition:'all .25s cubic-bezier(.25,.1,.25,1)'}}>
      {open?<X size={20}/>:<Bot size={20}/>}
      {unread>0&&!open&&<div style={{position:'absolute',top:-4,right:-4,width:18,height:18,background:'#DC2626',borderRadius:2,fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #080808',color:'#fff'}}>{unread}</div>}
    </button>
    {open&&(
      <div style={{position:'fixed',bottom:92,left:16,right:16,maxWidth:360,marginLeft:'auto',background:'linear-gradient(180deg,#111111 0%,#0A0A0A 100%)',border:'1px solid rgba(212,168,83,0.1)',borderRadius:4,boxShadow:'0 16px 60px rgba(0,0,0,0.7)',zIndex:200,overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:460}}>
        <div style={{padding:'14px 16px',background:'#D4A853',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:2,background:'rgba(8,8,8,0.15)',display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={16} color="#080808"/></div>
          <div><div style={{fontSize:13,fontWeight:700,color:'#080808'}}>مساعد {storeInfo.brand.name}</div><div style={{fontSize:9,color:'rgba(8,8,8,.65)'}}>متاح الآن · AI</div></div>
          <button onClick={()=>setOpen(false)} style={{marginRight:'auto',background:'none',border:'none',cursor:'pointer',color:'rgba(8,8,8,.7)',display:'flex'}}><X size={16}/></button>
        </div>
        <div style={{flex:1,overflow:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:8}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{maxWidth:'85%',alignSelf:m.role==='user'?'flex-end':'flex-start'}}>
              <div style={{padding:'8px 12px',borderRadius:2,background:m.role==='user'?'#D4A853':'rgba(212,168,83,0.06)',border:m.role==='user'?'none':'1px solid rgba(212,168,83,0.1)',color:m.role==='user'?'#080808':'#F5F0EB',fontSize:12,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{padding:'8px 12px',borderRadius:2,background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.1)',color:'rgba(245,240,235,0.4)',fontSize:12,alignSelf:'flex-start'}}>يكتب...</div>}
          <div ref={endRef}/>
        </div>
        <div style={{padding:'6px 10px',display:'flex',gap:5,flexWrap:'wrap',borderTop:'1px solid rgba(212,168,83,0.06)'}}>
          {['اشوف المنتجات','بكام التوصيل؟','تتبع طلبي'].map(q=>(
            <button key={q} onClick={()=>send(q)} style={{fontSize:10,padding:'4px 9px',borderRadius:2,background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.12)',color:'rgba(212,168,83,0.6)',cursor:'pointer'}}>{q}</button>
          ))}
        </div>
        <div style={{padding:'8px 10px',borderTop:'1px solid rgba(212,168,83,0.06)',display:'flex',gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="اكتب سؤالك..."
            style={{flex:1,padding:'8px 12px',fontSize:12,borderRadius:2,border:'1px solid rgba(212,168,83,0.12)',background:'rgba(212,168,83,0.03)',color:'#F5F0EB',outline:'none',fontFamily:'Tajawal,sans-serif'}}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:34,height:34,borderRadius:2,background:'#D4A853',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:(!input.trim()||loading)?.5:1}}><Send size={13} color="#080808"/></button>
        </div>
      </div>
    )}
  </>);
}

// ─── TRUST COUNTERS ───────────────────────────────────────────────────────────
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
    <div style={{margin:'20px 14px',background:'rgba(212,168,83,0.02)',backdropFilter:'blur(16px)',borderRadius:2,padding:'20px 14px',border:'1px solid rgba(212,168,83,0.08)',boxShadow:'0 4px 20px rgba(0,0,0,0.3)'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:0,textAlign:'center'}}>
        {[
          {n:`${count.c.toLocaleString()}+`,l:'عميل سعيد',icon:'😊',c:'#D4A853'},
          {n:`${count.o.toLocaleString()}+`,l:'طلب منجز',icon:'📦',c:'#D4A853'},
          {n:`${count.r}%`,l:'رضا العملاء',icon:'⭐',c:'#0D9488'},
        ].map((s,i)=>(
          <div key={i} style={{padding:'0 8px',borderLeft:i>0?'1px solid rgba(212,168,83,0.08)':'none'}}>
            <div style={{fontSize:22,fontWeight:700,color:s.c,letterSpacing:'-0.03em'}}>{s.n}</div>
            <div style={{fontSize:8,color:'rgba(245,240,235,0.3)',fontWeight:600,marginTop:4,letterSpacing:'.06em'}}>{s.icon} {s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
function HeroSection({brand,productCount,serviceCount,onShop,onServices}:{brand:StoreInfo['brand'];productCount:number;serviceCount:number;onShop:()=>void;onServices:()=>void}) {
  const hasServices=serviceCount>0;
  return (
    <div style={{position:'relative',overflow:'hidden',background:'linear-gradient(180deg,rgba(212,168,83,0.06) 0%,rgba(0,0,0,0) 50%)'}}>
      <MoroccanPattern opacity={0.04}/>
      {/* Ambient glows */}
      <div style={{position:'absolute',top:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,168,83,0.15),transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,rgba(212,168,83,0.1),transparent 70%)',pointerEvents:'none'}}/>
      <div style={{padding:'28px 20px 0',position:'relative',zIndex:1}}>
        {/* Store logo + info */}
        <div style={{display:'flex',gap:16,alignItems:'flex-start',marginBottom:20}}>
          <div style={{flexShrink:0,width:72,height:72,borderRadius:2,overflow:'hidden',background:'rgba(212,168,83,0.06)',backdropFilter:'blur(16px)',border:'1px solid rgba(212,168,83,0.2)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
            {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
              :<span style={{fontSize:28,fontWeight:700,color:'#D4A853'}}>{brand.name?.[0]?.toUpperCase()||'S'}</span>}
          </div>
          <div style={{flex:1}}>
            <h1 style={{fontSize:'clamp(20px,5vw,30px)',fontWeight:700,color:'#F5F0EB',margin:'0 0 5px',lineHeight:1.2,letterSpacing:'-0.02em'}}>{brand.name||'المتجر'}</h1>
            {brand.description&&<p style={{fontSize:13,color:'rgba(245,240,235,0.6)',margin:'0 0 12px',lineHeight:1.6}}>{brand.description}</p>}
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'5px 12px',borderRadius:2,background:'rgba(13,148,136,0.08)',border:'1px solid rgba(13,148,136,0.2)',color:'#0D9488',fontSize:11,fontWeight:600,textDecoration:'none'}}>💬 واتساب</a>}
              {brand.instagram&&<a href={`https://instagram.com/${brand.instagram}`} target="_blank" rel="noreferrer" style={{padding:'5px 12px',borderRadius:2,background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.15)',color:'#D4A853',fontSize:11,fontWeight:600,textDecoration:'none'}}>📸 Instagram</a>}
            </div>
          </div>
        </div>
        {/* CTA buttons */}
        <div style={{display:'flex',gap:10,marginBottom:20}}>
          <button onClick={onShop} style={{flex:1,height:48,borderRadius:2,background:'#D4A853',border:'none',color:'#080808',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(212,168,83,0.3)',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .25s cubic-bezier(.25,.1,.25,1)'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 28px rgba(212,168,83,0.4)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(212,168,83,0.3)';}}>
            <ShoppingCart size={16}/> تسوق الآن ({productCount})
          </button>
          {hasServices&&<button onClick={onServices} style={{flex:1,height:48,borderRadius:2,background:'rgba(212,168,83,0.08)',border:'1px solid rgba(212,168,83,0.25)',color:'#D4A853',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all .25s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(212,168,83,0.15)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(212,168,83,0.08)';}}>
            🔧 الخدمات ({serviceCount})
          </button>}
        </div>
        {/* Stats strip */}
        <div style={{background:'rgba(212,168,83,0.03)',backdropFilter:'blur(16px)',padding:'14px 16px',display:'flex',justifyContent:'space-around',border:'1px solid rgba(212,168,83,0.08)',borderBottom:'none'}}>
          {[{n:productCount,l:'منتج',c:'#D4A853'},{n:serviceCount,l:'خدمة',c:'#D4A853'},{n:'24h',l:'توصيل',c:'#0D9488'}].map((s,i)=>(
            <div key={i} style={{textAlign:'center',flex:1,borderLeft:i>0?'1px solid rgba(212,168,83,0.08)':'none'}}>
              <div style={{fontSize:20,fontWeight:700,color:s.c}}>{s.n}</div>
              <div style={{fontSize:9,color:'rgba(245,240,235,0.35)',fontWeight:600,marginTop:3,letterSpacing:'.04em'}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCROLL TO TOP ─────────────────────────────────────────────────────────────
function ScrollToTop() {
  const [show,setShow]=useState(false);
  useEffect(()=>{const h=()=>setShow(window.scrollY>400);window.addEventListener('scroll',h);return()=>window.removeEventListener('scroll',h);},[]);
  if(!show)return null;
  return (
    <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{position:'fixed',bottom:100,right:20,zIndex:150,width:40,height:40,borderRadius:2,background:'rgba(212,168,83,0.06)',backdropFilter:'blur(16px)',border:'1px solid rgba(212,168,83,0.15)',color:'#D4A853',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 16px rgba(0,0,0,0.3)',transition:'all .2s'}}><ChevronUp size={16}/></button>
  );
}

// ─── FILTER DRAWER ─────────────────────────────────────────────────────────────
function FilterDrawer({onClose,priceMin,priceMax,setPriceMin,setPriceMax,typeFilter,setTypeFilter,sortBy,setSortBy,maxP}:{onClose:()=>void;priceMin:number;priceMax:number;setPriceMin:(v:number)=>void;setPriceMax:(v:number)=>void;typeFilter:string;setTypeFilter:(v:string)=>void;sortBy:string;setSortBy:(v:any)=>void;maxP:number}) {
  const [lMin,setLMin]=useState(priceMin);
  const [lMax,setLMax]=useState(priceMax||maxP);
  const apply=()=>{setPriceMin(lMin);setPriceMax(lMax>=maxP?0:lMax);onClose();};
  const reset=()=>{setLMin(0);setLMax(maxP);setPriceMin(0);setPriceMax(0);setTypeFilter('all');onClose();};
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(8px)',zIndex:400,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:520,background:'linear-gradient(180deg,#111111 0%,#0A0A0A 100%)',border:'1px solid rgba(212,168,83,0.1)',borderRadius:'4px 4px 0 0',padding:'20px 20px 36px',boxShadow:'0 -8px 60px rgba(0,0,0,0.6)'}}>
        <div style={{width:40,height:3,background:'rgba(212,168,83,0.2)',borderRadius:0,margin:'0 auto 20px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{fontSize:16,fontWeight:700,color:'#F5F0EB',display:'flex',alignItems:'center',gap:8}}><SlidersHorizontal size={16} color="#D4A853"/> الفلاتر</h3>
          <button onClick={reset} style={{fontSize:11,color:'#D4A853',background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.15)',cursor:'pointer',fontWeight:600,padding:'5px 12px',borderRadius:2}}>إعادة تعيين</button>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:'rgba(245,240,235,0.35)',marginBottom:10,letterSpacing:'.04em'}}>نوع المنتج</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[['all','🛍️ الكل'],['product','📦 منتجات'],['service','🔧 خدمات'],['digital','💻 رقمي']].map(([v,l])=>(
              <button key={v} onClick={()=>setTypeFilter(v)} style={{padding:'7px 14px',borderRadius:2,border:`1.5px solid ${typeFilter===v?'#D4A853':'rgba(212,168,83,0.12)'}`,background:typeFilter===v?'rgba(212,168,83,0.08)':'rgba(212,168,83,0.02)',color:typeFilter===v?'#D4A853':'rgba(245,240,235,0.5)',fontSize:12,fontWeight:600,cursor:'pointer'}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:'rgba(245,240,235,0.35)',marginBottom:10,letterSpacing:'.04em'}}>السعر: <span style={{color:'#D4A853'}}>{lMin} — {lMax>=maxP?'∞':lMax}</span></div>
          <div style={{display:'flex',gap:12}}>
            <div style={{flex:1}}><div style={{fontSize:9,color:'rgba(245,240,235,0.25)',marginBottom:4}}>من</div><input type="range" min={0} max={maxP} step={10} value={lMin} onChange={e=>setLMin(Math.min(+e.target.value,lMax-10))} style={{width:'100%',accentColor:'#D4A853'}}/></div>
            <div style={{flex:1}}><div style={{fontSize:9,color:'rgba(245,240,235,0.25)',marginBottom:4}}>إلى</div><input type="range" min={0} max={maxP} step={10} value={lMax} onChange={e=>setLMax(Math.max(+e.target.value,lMin+10))} style={{width:'100%',accentColor:'#D4A853'}}/></div>
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:600,color:'rgba(245,240,235,0.35)',marginBottom:10,letterSpacing:'.04em'}}>الترتيب</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[['popular','🔥 الأكثر طلباً'],['newest','✨ الأحدث'],['price-asc','💰 الأقل سعراً'],['price-desc','💎 الأعلى سعراً']].map(([v,l])=>(
              <button key={v} onClick={()=>setSortBy(v)} style={{padding:'7px 12px',borderRadius:2,border:`1.5px solid ${sortBy===v?'#D4A853':'rgba(212,168,83,0.12)'}`,background:sortBy===v?'rgba(212,168,83,0.08)':'rgba(212,168,83,0.02)',color:sortBy===v?'#D4A853':'rgba(245,240,235,0.5)',fontSize:12,fontWeight:600,cursor:'pointer'}}>{l}</button>
            ))}
          </div>
        </div>
        <button onClick={apply} style={{width:'100%',height:50,background:'#D4A853',border:'none',borderRadius:2,color:'#080808',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 20px rgba(212,168,83,0.3)'}}>تطبيق</button>
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

  const maxP=useMemo(()=>Math.max(...products.map(p=>p.price),500),[products]);
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

  // ── Loading
  if(loading) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'#080808',padding:16,fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <style>{`@keyframes sfshim{0%{background-position:200% 0}100%{background-position:-200% 0}}.sfsk{background:linear-gradient(90deg,rgba(212,168,83,0.03) 25%,rgba(212,168,83,0.06) 50%,rgba(212,168,83,0.03) 75%);background-size:200% 100%;animation:sfshim 1.4s infinite;border-radius:2px;}`}</style>
      <div style={{height:48,borderRadius:2,marginBottom:12}} className="sfsk"/>
      <div style={{height:110,borderRadius:2,marginBottom:14}} className="sfsk"/>
      <div style={{height:36,borderRadius:2,marginBottom:14}} className="sfsk"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} style={{borderRadius:2,overflow:'hidden',border:'1px solid rgba(212,168,83,0.06)'}}><div style={{height:180}} className="sfsk"/><div style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:6,background:'rgba(212,168,83,0.02)'}}><div style={{height:10,width:'60%'}} className="sfsk"/><div style={{height:14,width:'90%'}} className="sfsk"/><div style={{height:18,width:'40%'}} className="sfsk"/></div></div>
        ))}
      </div>
    </div>
  );

  if(!userId) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'#080808',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center',gap:16,fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <div style={{fontSize:56,opacity:.3,color:'#D4A853'}}>🏪</div>
      <div style={{fontSize:22,fontWeight:700,color:'#F5F0EB'}}>متجر SAHAR Shop</div>
      <div style={{fontSize:14,color:'rgba(245,240,235,0.4)',maxWidth:320,lineHeight:1.8}}>اطلب من التاجر مشاركة رابط متجره الخاص معك.</div>
      <a href="/" style={{padding:'10px 24px',background:'#D4A853',borderRadius:2,color:'#080808',fontWeight:700,fontSize:14,textDecoration:'none'}}>الصفحة الرئيسية</a>
    </div>
  );

  if(error||(!loading&&!storeInfo)) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'#080808',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(245,240,235,0.4)',textAlign:'center',padding:24,fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <div><div style={{fontSize:40,marginBottom:16,opacity:.3}}>🏪</div><div style={{fontSize:18,fontWeight:700,color:'#F5F0EB',marginBottom:8}}>المتجر غير موجود</div><div style={{fontSize:14}}>{error||'تحقق من الرابط'}</div></div>
    </div>
  );

  const brand=storeInfo!.brand;
  const cur=brand.currency||'MAD';

  if(!loading&&!error&&storeInfo&&products.length===0) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'#080808',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',textAlign:'center',fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <div style={{width:72,height:72,borderRadius:2,overflow:'hidden',background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.12)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
        {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span style={{fontSize:30,color:'#D4A853'}}>🏪</span>}
      </div>
      <h1 style={{fontSize:26,fontWeight:700,color:'#D4A853',marginBottom:8}}>{brand.name||'المتجر'}</h1>
      <div style={{fontSize:64,margin:'20px 0 14px',opacity:.15,color:'#D4A853'}}>📦</div>
      <h2 style={{fontSize:18,fontWeight:700,color:'#F5F0EB',marginBottom:8}}>المتجر قيد التجهيز</h2>
      <p style={{fontSize:14,color:'rgba(245,240,235,0.4)',maxWidth:300,lineHeight:1.8,marginBottom:28}}>سيضاف المنتجات قريباً — تابعونا!</p>
      {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'12px 24px',borderRadius:2,background:'#0D9488',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none',boxShadow:'0 4px 20px rgba(13,148,136,0.25)'}}>💬 تواصل معنا</a>}
    </div>
  );

  const bestSellers=[...products].sort((a,b)=>(b.sales||0)-(a.sales||0)).slice(0,6).filter(p=>(p.sales||0)>0);
  const recentlyViewedIds:string[]=JSON.parse(localStorage.getItem(`sahar_viewed_${userId}`)||'[]');
  const recentlyViewed=recentlyViewedIds.slice(0,8).map(id=>products.find(p=>p.id===id)).filter(Boolean) as SProduct[];

  return (
    <div dir="rtl" style={{
      ...SF,
      minHeight:'100dvh',
      background:'#080808',
      color:'#F5F0EB',
      fontFamily:'Tajawal,system-ui,sans-serif',
    } as React.CSSProperties}>
      <style>{`
        @keyframes sfmarquee{0%{transform:translateX(-50%)}100%{transform:translateX(0%)}}
        @keyframes sfgradientshift{0%{background-position:0% 0}100%{background-position:200% 0}}
        @keyframes sfpulse{0%,100%{box-shadow:0 0 0 0 rgba(212,168,83,0.4)}50%{box-shadow:0 0 0 6px rgba(212,168,83,0)}}
        @keyframes sfshim{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .sfsk{background:linear-gradient(90deg,rgba(212,168,83,0.03) 25%,rgba(212,168,83,0.06) 50%,rgba(212,168,83,0.03) 75%);background-size:200% 100%;animation:sfshim 1.4s infinite;border-radius:2px;}
        body{background:#080808!important}
        .sf-input:focus{border-color:#D4A853!important;outline:none!important;box-shadow:0 0 0 3px rgba(212,168,83,0.08)!important}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(212,168,83,0.15);border-radius:0}
      `}</style>

      <PromoBar/>

      {/* ── HEADER */}
      <header style={{position:'sticky',top:0,zIndex:100,background:'rgba(8,8,8,0.9)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:'1px solid rgba(212,168,83,0.06)',padding:'0 14px',height:62,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,boxShadow:'0 1px 0 rgba(212,168,83,0.03),0 4px 24px rgba(0,0,0,0.4)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div style={{width:36,height:36,borderRadius:2,overflow:'hidden',background:'rgba(212,168,83,0.06)',border:'1px solid rgba(212,168,83,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
              :<span style={{fontSize:16,fontWeight:700,color:'#D4A853'}}>{brand.name?.[0]?.toUpperCase()||'S'}</span>}
          </div>
          <div style={{fontSize:14,fontWeight:600,color:'#F5F0EB',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{brand.name}</div>
        </div>
        {/* Search bar */}
        <div style={{flex:1,maxWidth:260,position:'relative'}}>
          <Search size={14} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'rgba(212,168,83,0.35)',pointerEvents:'none'}}/>
          <input className="sf-input" placeholder="ابحث..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:'100%',paddingRight:36,paddingLeft:14,height:38,borderRadius:2,border:'1px solid rgba(212,168,83,0.1)',background:'rgba(212,168,83,0.03)',backdropFilter:'blur(12px)',color:'#F5F0EB',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'Tajawal,sans-serif',transition:'all .2s'}}/>
        </div>
        <div style={{display:'flex',gap:7,alignItems:'center',flexShrink:0}}>
          <button onClick={()=>setShowTrack(true)} style={{padding:'5px 10px',borderRadius:2,background:'rgba(212,168,83,0.04)',border:'1px solid rgba(212,168,83,0.1)',color:'#D4A853',fontSize:10,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4,backdropFilter:'blur(8px)'}}><Package size={11}/> طلباتي</button>
          {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'5px 10px',borderRadius:2,background:'rgba(13,148,136,0.06)',border:'1px solid rgba(13,148,136,0.2)',color:'#0D9488',fontSize:10,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4,textDecoration:'none'}}><MessageCircle size={11}/> واتساب</a>}
          <button onClick={()=>setShowCart(true)} style={{position:'relative',width:38,height:38,borderRadius:2,background:cartAnim?'#D4A853':'rgba(212,168,83,0.04)',border:`1px solid ${cartAnim?'transparent':'rgba(212,168,83,0.1)'}`,color:cartAnim?'#080808':'#D4A853',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .25s',boxShadow:cartAnim?'0 4px 16px rgba(212,168,83,0.3)':'none'}}>
            <ShoppingCart size={17}/>
            {cart.count>0&&<span style={{position:'absolute',top:-5,left:-5,width:18,height:18,background:'#D4A853',borderRadius:2,fontSize:10,fontWeight:700,color:'#080808',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #080808'}}>{cart.count}</span>}
          </button>
        </div>
      </header>

      {/* ── HERO + TRUST */}
      <HeroSection brand={brand} productCount={allProducts.length} serviceCount={allServices.length} onShop={()=>{setActiveTab('all');setSelectedCategory('all');}} onServices={()=>{setActiveTab('خدمات');setSelectedCategory('خدمات');}}/>
      <TrustCounters productCount={products.length}/>

      {/* ── CATEGORY BAR */}
      <div style={{background:'rgba(8,8,8,0.9)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(212,168,83,0.06)',padding:'10px 0',position:'sticky',top:62,zIndex:90}}>
        <div style={{display:'flex',gap:8,overflowX:'auto',padding:'0 14px',scrollbarWidth:'none'}}>
          {categories.map(cat=>{
            const count=cat==='all'?products.length:products.filter(p=>p.category===cat).length;
            const EMOJI_MAP:Record<string,string>={'أحذية':'👟','ملابس نسائية':'👗','نسائي':'👗','ملابس رجالية':'👔','رجالي':'👔','أطفال':'👶','إكسسوارات':'💍','هدايا':'🎁','إلكترونيات':'📱','طعام':'🍽️','خدمات':'🔧'};
            const emoji=Object.entries(EMOJI_MAP).find(([k])=>cat.includes(k))?.[1]||(cat==='all'?'🛍️':'🏷️');
            const active=activeTab===cat;
            return (
              <button key={cat} onClick={()=>{setActiveTab(cat);setSelectedCategory(cat);}}
                style={{flexShrink:0,padding:'7px 14px',borderRadius:2,fontSize:11,fontWeight:600,cursor:'pointer',
                  border:`1px solid ${active?'#D4A853':'rgba(212,168,83,0.08)'}`,
                  background:active?'rgba(212,168,83,0.08)':'rgba(212,168,83,0.02)',
                  color:active?'#D4A853':'rgba(245,240,235,0.5)',
                  backdropFilter:'blur(8px)',
                  transition:'all .2s',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>
                <span>{emoji}</span>{cat==='all'?'الكل':cat}<span style={{fontSize:9,opacity:.5,fontWeight:500}}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SEARCH + FILTER ROW */}
      <div style={{padding:'14px 14px 0',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <span style={{fontSize:11,color:'rgba(245,240,235,0.35)',fontWeight:600}}>
          {filteredProducts.length+filteredServices.length+filteredDigital.length} نتيجة
          {hasActiveFilter&&<button onClick={()=>{setPriceMin(0);setPriceMax(0);setTypeFilter('all');}} style={{marginRight:6,fontSize:9,color:'#D4A853',background:'rgba(212,168,83,0.08)',border:'none',borderRadius:2,padding:'2px 8px',cursor:'pointer',fontWeight:600}}>× مسح</button>}
        </span>
        <div style={{display:'flex',gap:6}}>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} style={{background:'rgba(212,168,83,0.03)',border:'1px solid rgba(212,168,83,0.1)',borderRadius:2,padding:'6px 10px',color:'rgba(245,240,235,0.6)',fontSize:11,cursor:'pointer',outline:'none',backdropFilter:'blur(8px)'}}>
            <option value="popular">الأكثر طلباً</option>
            <option value="newest">الأحدث</option>
            <option value="price-asc">الأقل سعراً</option>
            <option value="price-desc">الأعلى سعراً</option>
          </select>
          <button onClick={()=>setShowFilters(true)} style={{width:34,height:34,borderRadius:2,background:hasActiveFilter?'rgba(212,168,83,0.1)':'rgba(212,168,83,0.03)',border:`1px solid ${hasActiveFilter?'rgba(212,168,83,0.3)':'rgba(212,168,83,0.1)'}`,color:hasActiveFilter?'#D4A853':'rgba(245,240,235,0.5)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',backdropFilter:'blur(8px)'}}>
            <Filter size={13}/>
            {hasActiveFilter&&<span style={{position:'absolute',top:-4,right:-4,width:9,height:9,background:'#DC2626',borderRadius:2,border:'2px solid #080808'}}/>}
          </button>
        </div>
      </div>

      {/* ── TRUST BADGES */}
      <div style={{padding:'12px 14px',display:'flex',gap:8,overflowX:'auto',scrollbarWidth:'none'}}>
        {[{i:'🚚',t:'توصيل 24-48h'},{i:'💵',t:'دفع عند الاستلام'},{i:'🔄',t:'إرجاع 7 أيام'},{i:'🔒',t:'دفع آمن'},{i:'⭐',t:'جودة مضمونة'}].map(b=>(
          <div key={b.t} style={{display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',fontSize:10,color:'rgba(245,240,235,0.5)',fontWeight:600,padding:'5px 11px',borderRadius:2,background:'rgba(212,168,83,0.02)',border:'1px solid rgba(212,168,83,0.06)',flexShrink:0,backdropFilter:'blur(8px)'}}>
            <span>{b.i}</span><span>{b.t}</span>
          </div>
        ))}
      </div>

      <div style={{padding:'0 14px 110px'}}>

        {/* ── BEST SELLERS */}
        {bestSellers.length>=2&&!search&&activeTab==='all'&&(
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
              <Flame size={15} color="#D4A853"/>
              <span style={{fontSize:15,fontWeight:700,color:'#F5F0EB'}}>الأكثر طلباً</span>
            </div>
            <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:6,scrollbarWidth:'none'}}>
              {bestSellers.map(p=>(
                <div key={p.id} onClick={()=>{trackViewed(p);setViewProduct(p);}} style={{flexShrink:0,width:220,borderRadius:2,overflow:'hidden',cursor:'pointer',background:'rgba(212,168,83,0.02)',backdropFilter:'blur(16px)',border:'1px solid rgba(212,168,83,0.08)',transition:'all .25s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,168,83,0.12)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';(e.currentTarget as HTMLElement).style.boxShadow='';}}>
                  <div style={{height:110,position:'relative',background:'#080808',overflow:'hidden'}}>
                    {p.imageUrl?<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,color:'rgba(212,168,83,0.15)'}}>{p.emoji||'📦'}</div>}
                    <span style={{position:'absolute',top:8,right:8,background:'#D4A853',color:'#080808',fontSize:9,fontWeight:700,padding:'3px 8px',borderRadius:2}}>🔥 #{bestSellers.indexOf(p)+1}</span>
                  </div>
                  <div style={{padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><div style={{fontSize:12,fontWeight:600,color:'#F5F0EB',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',maxWidth:120}}>{p.name}</div><div style={{fontSize:9,color:'rgba(245,240,235,0.3)'}}>{p.sales} طلب</div></div>
                    <div style={{fontSize:15,fontWeight:700,color:'#D4A853',flexShrink:0}}>{p.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRODUCTS */}
        {filteredProducts.length>0&&(
          <div style={{marginBottom:36}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:2,height:20,background:'#D4A853',borderRadius:0}}/>
                <span style={{fontSize:16,fontWeight:700,color:'#F5F0EB'}}>منتجاتنا</span>
                <span style={{fontSize:10,color:'rgba(245,240,235,0.3)',background:'rgba(212,168,83,0.03)',border:'1px solid rgba(212,168,83,0.08)',padding:'2px 9px',borderRadius:2}}>{filteredProducts.length}</span>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:14}}>
              {filteredProducts.map(p=>(
                <ProductCard key={p.id} p={p} currency={cur} onAdd={handleAddToCart} onView={p=>{trackViewed(p);setViewProduct(p);}}/>
              ))}
            </div>
          </div>
        )}

        {/* ── SERVICES */}
        {filteredServices.length>0&&(
          <div style={{marginBottom:36}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:2,height:20,background:'#D4A853',borderRadius:0}}/>
              <span style={{fontSize:16,fontWeight:700,color:'#F5F0EB'}}>خدماتنا</span>
              <span style={{fontSize:10,color:'rgba(245,240,235,0.3)',background:'rgba(212,168,83,0.03)',border:'1px solid rgba(212,168,83,0.08)',padding:'2px 9px',borderRadius:2}}>{filteredServices.length}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {filteredServices.map(p=>(
                <ServiceCard key={p.id} p={p} currency={cur} onView={p=>{trackViewed(p);setViewProduct(p);}}/>
              ))}
            </div>
          </div>
        )}

        {/* ── DIGITAL */}
        {filteredDigital.length>0&&(
          <div style={{marginBottom:36}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:2,height:20,background:'#0D9488',borderRadius:0}}/>
              <span style={{fontSize:16,fontWeight:700,color:'#F5F0EB'}}>المنتجات الرقمية</span>
              <span style={{fontSize:10,color:'rgba(245,240,235,0.3)',background:'rgba(212,168,83,0.03)',border:'1px solid rgba(212,168,83,0.08)',padding:'2px 9px',borderRadius:2}}>{filteredDigital.length}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:14}}>
              {filteredDigital.map(p=><ProductCard key={p.id} p={p} currency={cur} onAdd={handleAddToCart} onView={p=>{trackViewed(p);setViewProduct(p);}}/>)}
            </div>
          </div>
        )}

        {/* ── RECENTLY VIEWED */}
        {recentlyViewed.length>0&&!search&&(
          <div style={{marginBottom:24}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <Eye size={13} color="rgba(212,168,83,0.4)"/>
              <span style={{fontSize:12,fontWeight:600,color:'rgba(245,240,235,0.4)'}}>شاهدتها مؤخراً</span>
            </div>
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,scrollbarWidth:'none'}}>
              {recentlyViewed.filter(p=>!viewProduct||p.id!==viewProduct.id).slice(0,6).map(p=>(
                <div key={p.id} onClick={()=>{trackViewed(p);setViewProduct(p);}} style={{flexShrink:0,width:90,borderRadius:2,overflow:'hidden',cursor:'pointer',background:'rgba(212,168,83,0.02)',border:'1px solid rgba(212,168,83,0.06)',backdropFilter:'blur(8px)'}}>
                  <div style={{height:72,background:'#080808',overflow:'hidden'}}>
                    {p.imageUrl?<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,color:'rgba(212,168,83,0.15)'}}>{p.emoji||'📦'}</div>}
                  </div>
                  <div style={{padding:'5px 7px'}}><div style={{fontSize:10,fontWeight:600,color:'rgba(245,240,235,0.7)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{p.name}</div><div style={{fontSize:11,fontWeight:700,color:'#D4A853'}}>{p.price.toLocaleString()}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EMPTY */}
        {filteredProducts.length===0&&filteredServices.length===0&&filteredDigital.length===0&&(search||hasActiveFilter)&&(
          <div style={{textAlign:'center',padding:'60px 20px',background:'rgba(212,168,83,0.02)',borderRadius:2,border:'1px solid rgba(212,168,83,0.06)'}}>
            <Package size={48} style={{margin:'0 auto 16px',opacity:.1,color:'#D4A853'}}/>
            <div style={{fontSize:16,fontWeight:600,color:'rgba(245,240,235,0.6)',marginBottom:8}}>لم نجد نتائج</div>
            <div style={{fontSize:13,color:'rgba(245,240,235,0.3)',marginBottom:16}}>جرب كلمة أخرى أو امسح الفلاتر</div>
            <button onClick={()=>{setSearch('');setPriceMin(0);setPriceMax(0);setTypeFilter('all');setActiveTab('all');setSelectedCategory('all');}} style={{padding:'9px 24px',background:'#D4A853',border:'none',borderRadius:2,color:'#080808',cursor:'pointer',fontWeight:700,fontSize:13}}>مسح الكل</button>
          </div>
        )}

        {/* ── FOOTER */}
        <div style={{marginTop:40,paddingTop:24,borderTop:'1px solid rgba(212,168,83,0.06)',textAlign:'center'}}>
          <div style={{fontSize:12,color:'rgba(245,240,235,0.3)',marginBottom:8,fontWeight:600}}>{brand.name}</div>
          <div style={{display:'flex',justifyContent:'center',gap:16,marginBottom:14}}>
            {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#0D9488',fontWeight:600,textDecoration:'none'}}>💬 واتساب</a>}
            {brand.instagram&&<a href={`https://instagram.com/${brand.instagram}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#D4A853',fontWeight:600,textDecoration:'none'}}>📸 Instagram</a>}
            {brand.facebook&&<a href={`https://facebook.com/${brand.facebook}`} target="_blank" rel="noreferrer" style={{fontSize:11,color:'#D4A853',fontWeight:600,textDecoration:'none'}}>📘 Facebook</a>}
          </div>
          <div style={{fontSize:9,color:'rgba(212,168,83,0.15)'}}>Powered by SAHAR Shop 🇲🇦</div>
        </div>
      </div>

      {/* ── STICKY CART */}
      {cart.count>0&&!showCart&&(
        <div style={{position:'fixed',bottom:20,right:14,left:14,zIndex:150}}>
          <button onClick={()=>setShowCart(true)} style={{width:'100%',height:54,background:'#D4A853',border:'none',borderRadius:2,color:'#080808',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:'0 8px 32px rgba(212,168,83,0.35),0 0 0 1px rgba(212,168,83,0.2)'}}>
            <ShoppingCart size={18}/>
            السلة ({cart.count})
            <span style={{background:'rgba(8,8,8,0.12)',backdropFilter:'blur(8px)',borderRadius:2,padding:'2px 12px',fontSize:13,fontWeight:700}}>{cart.total.toLocaleString()} {cur}</span>
          </button>
        </div>
      )}

      {/* ── MODALS */}
      {viewProduct&&<ProductModal p={viewProduct} cart={cart} onClose={()=>setViewProduct(null)} currency={cur} userId={userId}/>}
      {showCart&&<CartSidebar cart={cart} storeInfo={storeInfo!} userId={userId} onClose={()=>setShowCart(false)} onOrderSuccess={id=>{setSuccessOrderId(id);setShowCart(false);}}/>}
      {showTrack&&<TrackingModal userId={userId} storeInfo={storeInfo!} onClose={()=>setShowTrack(false)}/>}
      {showFilters&&<FilterDrawer onClose={()=>setShowFilters(false)} priceMin={priceMin} priceMax={priceMax||maxP} setPriceMin={setPriceMin} setPriceMax={setPriceMax} typeFilter={typeFilter} setTypeFilter={setTypeFilter} sortBy={sortBy} setSortBy={setSortBy} maxP={maxP}/>}
      <FloatingChat userId={userId} storeInfo={storeInfo!}/>
      <ScrollToTop/>
    </div>
  );
}