import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, ShoppingCart, X, MessageCircle, Share2, Plus, Minus, Check,
  Package, Heart, Send, Bot, ArrowRight, Play,
  Flame, ChevronUp, Clock, MapPin, Filter, SlidersHorizontal, Eye,
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
         instagram?:string;facebook?:string;whatsapp?:string;email?:string;
         workStart?:string;workEnd?:string;address?:string};
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
// Lowest real delivery cost configured by the merchant (real data)
function minDeliveryCost(costs?:Record<string,number>):number {
  const all={ ...DEFAULT_COSTS, ...(costs||{}) };
  const vals=Object.entries(all).filter(([k])=>k!=='default').map(([,v])=>v).filter(v=>v>0);
  return vals.length?Math.min(...vals):0;
}
// Open/closed status from real working hours
function storeOpenStatus(workStart?:string,workEnd?:string):{open:boolean;label:string}|null {
  if(!workStart||!workEnd) return null;
  const now=new Date();const cur=now.getHours()*60+now.getMinutes();
  const [sh,sm]=workStart.split(':').map(Number);const [eh,em]=workEnd.split(':').map(Number);
  if(isNaN(sh)||isNaN(eh)) return null;
  const start=sh*60+(sm||0);const end=eh*60+(em||0);
  const open=cur>=start&&cur<=end;
  return {open,label:open?`مفتوح الآن · حتى ${workEnd}`:`مغلق · يفتح ${workStart}`};
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

// ─── DESIGN TOKENS — Clean light + single orange accent ──────────────────────
const SF:React.CSSProperties = {
  '--sf-bg':'#F6F7F9',
  '--sf-surface':'#FFFFFF',
  '--sf-surface2':'#F2F3F6',
  '--sf-border':'#ECECF0',
  '--sf-border2':'#E2E3E9',
  '--sf-text':'#16181D',
  '--sf-text2':'#5A616B',
  '--sf-text3':'#9AA0AA',
  '--sf-accent':'#FF6A00',
  '--sf-accent-hover':'#E85F00',
  '--sf-accent-soft':'#FFF3EB',
  '--sf-accent-border':'#FFD9BF',
  '--sf-success':'#16A34A',
  '--sf-success-soft':'#ECFDF3',
  '--sf-danger':'#E5484D',
  '--sf-shadow':'0 1px 3px rgba(16,24,40,0.06),0 1px 2px rgba(16,24,40,0.04)',
  '--sf-shadow-md':'0 4px 16px rgba(16,24,40,0.08)',
  '--sf-shadow-lg':'0 12px 32px rgba(16,24,40,0.12)',
  '--sf-r':'14px',
  '--sf-r-sm':'10px',
} as React.CSSProperties;

// ─── INFO BAR (real working hours / delivery) ────────────────────────────────
function InfoBar({status,minDelivery,currency}:{status:{open:boolean;label:string}|null;minDelivery:number;currency:string}) {
  const bits:{icon:string;text:string;color?:string}[]=[];
  if(status) bits.push({icon:status.open?'🟢':'🔴',text:status.label,color:status.open?'var(--sf-success)':'var(--sf-text3)'});
  if(minDelivery>0) bits.push({icon:'🚚',text:`التوصيل من ${minDelivery} ${currency}`});
  bits.push({icon:'💵',text:'دفع عند الاستلام'});
  return (
    <div style={{background:'var(--sf-surface)',borderBottom:'1px solid var(--sf-border)',height:34,display:'flex',alignItems:'center',gap:18,padding:'0 16px',overflowX:'auto',scrollbarWidth:'none',fontSize:12}}>
      {bits.map((b,i)=>(
        <span key={i} style={{display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',color:b.color||'var(--sf-text2)',fontWeight:600,flexShrink:0}}>
          <span style={{fontSize:10}}>{b.icon}</span>{b.text}
        </span>
      ))}
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
      style={{background:'var(--sf-surface)',borderRadius:'var(--sf-r)',overflow:'hidden',cursor:'pointer',
        border:`1px solid ${hover?'var(--sf-border2)':'var(--sf-border)'}`,
        boxShadow:hover?'var(--sf-shadow-md)':'var(--sf-shadow)',
        transform:hover?'translateY(-3px)':'none',
        transition:'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
      }}>
      <div style={{aspectRatio:'1/1',position:'relative',background:'var(--sf-surface2)',overflow:'hidden'}}>
        {imgs.length>0
          ?<img src={imgs[imgIdx]} alt={p.name} loading="lazy"
              style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .4s ease',transform:hover?'scale(1.05)':'scale(1)'}}/>
          :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:52}}>{p.emoji||'📦'}</div>
        }
        <div style={{position:'absolute',bottom:10,left:0,right:0,display:'flex',gap:8,justifyContent:'center',
          opacity:hover?1:0,transform:hover?'translateY(0)':'translateY(8px)',transition:'all .2s ease',zIndex:2}}>
          <button onClick={e=>{e.stopPropagation();onView(p);}} title="معاينة"
            style={{width:36,height:36,borderRadius:'50%',background:'#fff',border:'1px solid var(--sf-border)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--sf-shadow-md)',transition:'all .15s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='scale(1.08)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';}}>
            <Eye size={15} color="var(--sf-text2)"/>
          </button>
          <button onClick={quickAdd} title={p.type==='service'?'احجز':'أضف للسلة'}
            style={{width:36,height:36,borderRadius:'50%',background:addedFlash?'var(--sf-success)':'var(--sf-accent)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--sf-shadow-md)',transition:'all .15s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='scale(1.08)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';}}>
            {addedFlash?<Check size={15} color="#fff"/>:<ShoppingCart size={15} color="#fff"/>}
          </button>
          <button onClick={toggleLike} title="مفضلة"
            style={{width:36,height:36,borderRadius:'50%',background:'#fff',border:`1px solid ${liked?'var(--sf-accent-border)':'var(--sf-border)'}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--sf-shadow-md)',transition:'all .15s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='scale(1.08)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='';}}>
            <Heart size={15} fill={liked?'#E5484D':'none'} color={liked?'#E5484D':'var(--sf-text2)'}/>
          </button>
        </div>
        <div style={{position:'absolute',top:10,right:10,display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end',zIndex:2}}>
          {p.type==='service'&&<span style={{background:'#16181D',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99}}>خدمة</span>}
          {p.type==='digital'&&<span style={{background:'#16181D',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99}}>رقمي</span>}
          {(!p.type||p.type==='product')&&isNew&&<span style={{background:'var(--sf-success)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99}}>جديد</span>}
          {p.stock<=3&&p.stock>0&&(!p.type||p.type==='product')&&<span style={{background:'var(--sf-accent)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99}}>آخر {p.stock}</span>}
          {(!p.type||p.type==='product')&&p.stock===0&&<span style={{background:'var(--sf-text3)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 9px',borderRadius:99}}>نفذ</span>}
        </div>
        <button onClick={toggleLike} style={{position:'absolute',top:10,left:10,width:30,height:30,borderRadius:'50%',background:'rgba(255,255,255,.92)',border:'1px solid var(--sf-border)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,opacity:hover?0:1,transition:'opacity .2s'}}>
          <Heart size={14} fill={liked?'#E5484D':'none'} color={liked?'#E5484D':'var(--sf-text3)'}/>
        </button>
      </div>
      <div style={{padding:'12px 13px 14px'}}>
        <div style={{fontSize:10,color:'var(--sf-text3)',fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase',marginBottom:5}}>{p.category||'—'}</div>
        <div style={{fontSize:13,fontWeight:600,color:'var(--sf-text)',marginBottom:8,lineHeight:1.4,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',minHeight:36}}>{p.name}</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:17,fontWeight:800,color:'var(--sf-text)',letterSpacing:'-0.02em'}}>
            {p.price.toLocaleString()} <span style={{fontSize:11,fontWeight:500,color:'var(--sf-text3)'}}>{currency}</span>
          </div>
          {p.sales>0&&<span style={{fontSize:11,color:'var(--sf-text3)',fontWeight:600}}>{p.sales} مبيع</span>}
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
      style={{background:'var(--sf-surface)',borderRadius:'var(--sf-r)',padding:'14px',cursor:'pointer',
        border:`1px solid ${hover?'var(--sf-border2)':'var(--sf-border)'}`,
        boxShadow:hover?'var(--sf-shadow-md)':'var(--sf-shadow)',
        transform:hover?'translateY(-2px)':'none',
        transition:'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
        display:'flex',gap:13,alignItems:'center'}}>
      <div style={{flexShrink:0,width:64,height:64,borderRadius:12,background:'var(--sf-accent-soft)',border:'1px solid var(--sf-accent-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,overflow:'hidden'}}>
        {p.imageUrl?<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span>{emoji}</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:3}}>
          <div style={{fontSize:14,fontWeight:700,color:'var(--sf-text)',lineHeight:1.3,flex:1}}>{p.name}</div>
          <div style={{fontSize:15,fontWeight:800,color:'var(--sf-text)',flexShrink:0,letterSpacing:'-0.02em'}}>
            {p.price.toLocaleString()} <span style={{fontSize:10,fontWeight:500,color:'var(--sf-text3)'}}>{currency}</span>
          </div>
        </div>
        {p.description&&<div style={{fontSize:12,color:'var(--sf-text2)',lineHeight:1.5,marginBottom:8,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical'}}>{p.description}</div>}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:6}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            {p.duration&&<span style={{display:'flex',alignItems:'center',gap:3,fontSize:11,color:'var(--sf-text2)',background:'var(--sf-surface2)',borderRadius:99,padding:'3px 8px'}}><Clock size={10}/> {p.duration}</span>}
            {p.workArea&&<span style={{display:'flex',alignItems:'center',gap:3,fontSize:11,color:'var(--sf-text2)',background:'var(--sf-surface2)',borderRadius:99,padding:'3px 8px'}}><MapPin size={10}/> {p.workArea}</span>}
            {p.sales>0&&<span style={{fontSize:11,color:'var(--sf-text3)'}}>{p.sales} حجز</span>}
          </div>
          <button onClick={e=>{e.stopPropagation();onView(p);}}
            style={{flexShrink:0,padding:'6px 14px',borderRadius:99,background:'var(--sf-accent)',border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            احجز
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
    <div style={{position:'fixed',inset:0,zIndex:600,background:'rgba(0,0,0,.92)',display:'flex',alignItems:'center',justifyContent:'center',touchAction:'none'}} onClick={onClose}>
      <button onClick={onClose} style={{position:'absolute',top:16,left:16,width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,.15)',border:'none',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3}}><X size={20}/></button>
      <div style={{position:'absolute',top:22,right:20,color:'rgba(255,255,255,.6)',fontSize:13,fontWeight:700,zIndex:3}}>{idx+1}/{images.length}</div>
      <div onClick={e=>{e.stopPropagation();setZoom(z=>z>1?1:2.5);setPan({x:0,y:0});}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        <img src={images[idx]} alt="" draggable={false} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transition:touch.current?'none':'transform .2s',cursor:zoom>1?'grab':'zoom-in',userSelect:'none'}}/>
      </div>
      {images.length>1&&<>
        <button onClick={e=>{e.stopPropagation();go(1);}} disabled={idx>=images.length-1} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,.15)',border:'none',color:'#fff',cursor:'pointer',fontSize:22,zIndex:3,opacity:idx>=images.length-1?.3:1}}>‹</button>
        <button onClick={e=>{e.stopPropagation();go(-1);}} disabled={idx<=0} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,.15)',border:'none',color:'#fff',cursor:'pointer',fontSize:22,zIndex:3,opacity:idx<=0?.3:1}}>›</button>
      </>}
      {images.length>1&&(
        <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:16,left:0,right:0,display:'flex',gap:6,justifyContent:'center',overflowX:'auto',padding:'0 16px',zIndex:3}}>
          {images.map((img,i)=>(
            <button key={i} onClick={()=>{setIdx(i);setZoom(1);setPan({x:0,y:0});}} style={{flexShrink:0,width:44,height:44,borderRadius:8,overflow:'hidden',border:`2px solid ${i===idx?'#FF6A00':'rgba(255,255,255,.25)'}`,padding:0,cursor:'pointer',background:'#000'}}>
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

  return (<>
    {lightboxIdx!==null&&galleryImgs.length>0&&<Lightbox images={galleryImgs} startIndex={lightboxIdx} onClose={()=>setLightboxIdx(null)}/>}
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(16,24,40,.45)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--sf-surface)',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:520,maxHeight:'93vh',overflowY:'auto',boxShadow:'var(--sf-shadow-lg)'}}>
        {/* Image */}
        <div style={{aspectRatio:'1/1',maxHeight:300,position:'relative',background:'var(--sf-surface2)',flexShrink:0,overflow:'hidden'}}>
          {showVideo&&p.videoUrl
            ?<video src={p.videoUrl} controls autoPlay playsInline style={{width:'100%',height:'100%',objectFit:'contain',background:'#000'}}/>
            :activeImage
            ?<img src={activeImage} alt={p.name} onClick={()=>{const i=galleryImgs.indexOf(activeImage);setLightboxIdx(i>=0?i:0);}}
                style={{width:'100%',height:'100%',objectFit:'cover',cursor:'zoom-in'}}/>
            :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:80}}>{p.emoji||'📦'}</div>
          }
          <button onClick={onClose} style={{position:'absolute',top:14,left:14,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.95)',border:'1px solid var(--sf-border)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--sf-shadow)',zIndex:2}}><X size={16} color="var(--sf-text)"/></button>
          <button onClick={share} style={{position:'absolute',top:14,right:14,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,.95)',border:'1px solid var(--sf-border)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--sf-shadow)',zIndex:2}}><Share2 size={15} color="var(--sf-text2)"/></button>
        </div>
        {/* Thumbnails */}
        {(galleryImgs.length>1||p.videoUrl)&&(
          <div style={{display:'flex',gap:6,overflowX:'auto',padding:'10px 16px',background:'var(--sf-surface)',borderBottom:'1px solid var(--sf-border)'}}>
            {galleryImgs.map((img,i)=>(
              <button key={i} onClick={()=>{setShowVideo(false);setActiveImage(img);}} style={{flexShrink:0,width:52,height:52,borderRadius:9,overflow:'hidden',border:`2px solid ${!showVideo&&activeImage===img?'var(--sf-accent)':'var(--sf-border)'}`,background:'var(--sf-surface2)',cursor:'pointer',padding:0}}>
                <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </button>
            ))}
            {p.videoUrl&&(
              <button onClick={()=>setShowVideo(true)} style={{flexShrink:0,width:52,height:52,borderRadius:9,border:`2px solid ${showVideo?'var(--sf-accent)':'var(--sf-border)'}`,background:'#16181D',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Play size={18} color="#fff"/>
              </button>
            )}
          </div>
        )}
        <div style={{padding:'18px 18px 0'}}>
          <div style={{fontSize:11,color:'var(--sf-text3)',marginBottom:4,fontWeight:600}}>{p.category}{p.sku?` · #${p.sku}`:''}</div>
          <h2 style={{fontSize:20,fontWeight:800,color:'var(--sf-text)',margin:'0 0 10px',lineHeight:1.3}}>{p.name}</h2>
          {/* Price + real sales */}
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:14}}>
            <div style={{fontSize:26,fontWeight:800,color:'var(--sf-text)',letterSpacing:'-0.03em'}}>{p.price.toLocaleString()} <span style={{fontSize:14,color:'var(--sf-text3)',fontWeight:500}}>{currency}</span></div>
            {p.sales>0&&(
              <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--sf-accent-soft)',border:'1px solid var(--sf-accent-border)',borderRadius:99,padding:'5px 11px'}}>
                <Flame size={13} color="var(--sf-accent)"/>
                <span style={{fontSize:12,fontWeight:700,color:'var(--sf-accent)'}}>{p.sales} {p.type==='service'?'حجز':'مبيع'}</span>
              </div>
            )}
          </div>
          {/* Stock note — real */}
          {(!p.type||p.type==='product')&&p.stock>0&&p.stock<=10&&(
            <div style={{fontSize:12,color:'var(--sf-danger)',fontWeight:600,marginBottom:14}}>⚡ متبقي {p.stock} فقط في المخزون</div>
          )}
          {p.description&&<p style={{fontSize:13,color:'var(--sf-text2)',lineHeight:1.65,marginBottom:14}}>{p.description}</p>}
          {/* Custom fields — real */}
          {p.customFields&&p.customFields.filter(f=>f.value).length>0&&(
            <div style={{marginBottom:14,padding:'10px 12px',background:'var(--sf-surface2)',borderRadius:'var(--sf-r-sm)',display:'flex',flexDirection:'column',gap:5}}>
              {p.customFields.filter(f=>f.value).map(f=>(
                <div key={f.id} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                  <span style={{color:'var(--sf-text3)',fontWeight:600}}>{f.label}</span>
                  <span style={{color:'var(--sf-text)',fontWeight:600}}>{f.value}</span>
                </div>
              ))}
            </div>
          )}
          {/* Service meta — real */}
          {p.type==='service'&&(p.duration||p.workArea)&&(
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              {p.duration&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--sf-text2)',background:'var(--sf-surface2)',borderRadius:99,padding:'5px 12px'}}><Clock size={11}/> {p.duration}</span>}
              {p.workArea&&<span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--sf-text2)',background:'var(--sf-surface2)',borderRadius:99,padding:'5px 12px'}}><MapPin size={11}/> {p.workArea}</span>}
            </div>
          )}
          {p.type==='digital'&&<div style={{marginBottom:14,padding:'9px 12px',background:'var(--sf-surface2)',borderRadius:'var(--sf-r-sm)',fontSize:12,color:'var(--sf-text2)'}}>💻 منتج رقمي — يُرسل إليك بعد تأكيد الطلب</div>}
          {/* Sizes */}
          {(!p.type||p.type==='product')&&p.sizes?.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--sf-text3)',marginBottom:8}}>المقاس</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {p.sizes.map(s=>(
                  <button key={s} onClick={()=>setSize(s)} style={{padding:'7px 15px',borderRadius:'var(--sf-r-sm)',border:`1.5px solid ${size===s?'var(--sf-accent)':'var(--sf-border)'}`,background:size===s?'var(--sf-accent-soft)':'var(--sf-surface)',color:size===s?'var(--sf-accent)':'var(--sf-text2)',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all .15s'}}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {/* Colors */}
          {p.colors?.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--sf-text3)',marginBottom:8}}>اللون: <span style={{color:'var(--sf-text2)'}}>{color}</span></div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {p.colors.map(clr=>{
                  const colorImg=p.colorImages?.[clr];
                  const CM:Record<string,string>={'أسود':'#1a1a1a','أبيض':'#f5f5f5','أحمر':'#ef4444','أزرق':'#3b82f6','أخضر':'#22c55e','رمادي':'#6b7280','بيج':'#d4b896','وردي':'#f472b6','بني':'#92400e','كحلي':'#1e3a5f','بنفسجي':'#a855f7','برتقالي':'#f97316'};
                  return colorImg?(
                    <button key={clr} onClick={()=>{setColor(clr);setActiveImage(colorImg||p.imageUrl||'');}} style={{padding:3,borderRadius:10,border:`2px solid ${color===clr?'var(--sf-accent)':'var(--sf-border)'}`,cursor:'pointer',background:'transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <img src={colorImg} alt={clr} style={{width:50,height:50,objectFit:'cover',borderRadius:7}}/>
                      <span style={{fontSize:9,fontWeight:700,color:color===clr?'var(--sf-accent)':'var(--sf-text3)'}}>{clr}</span>
                    </button>
                  ):(
                    <button key={clr} onClick={()=>setColor(clr)} style={{width:30,height:30,borderRadius:'50%',background:CM[clr]||'#ccc',border:`3px solid ${color===clr?'var(--sf-accent)':'var(--sf-border)'}`,cursor:'pointer',boxShadow:'inset 0 0 0 1px rgba(0,0,0,.06)',transition:'border-color .15s'}} title={clr}/>
                  );
                })}
              </div>
            </div>
          )}
          {/* Related — real */}
          {p.category&&(window as any).__sfProducts?.filter((rp:any)=>rp.id!==p.id&&rp.category===p.category).length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--sf-text3)',marginBottom:10}}>قد يعجبك أيضاً</div>
              <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
                {(window as any).__sfProducts.filter((rp:any)=>rp.id!==p.id&&rp.category===p.category).slice(0,4).map((rp:any)=>(
                  <div key={rp.id} onClick={()=>{onClose();setTimeout(()=>document.dispatchEvent(new CustomEvent('viewProduct',{detail:rp})),50);}}
                    style={{flexShrink:0,width:90,borderRadius:10,overflow:'hidden',cursor:'pointer',background:'var(--sf-surface)',border:'1px solid var(--sf-border)'}}>
                    <div style={{height:72,background:'var(--sf-surface2)',overflow:'hidden'}}>
                      {rp.imageUrl?<img src={rp.imageUrl} alt={rp.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{rp.emoji||'📦'}</div>}
                    </div>
                    <div style={{padding:'5px 7px'}}>
                      <div style={{fontSize:10,fontWeight:600,color:'var(--sf-text)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{rp.name}</div>
                      <div style={{fontSize:11,fontWeight:800,color:'var(--sf-text)'}}>{rp.price.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Qty */}
          {(!p.type||p.type==='product')&&(
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <span style={{fontSize:11,fontWeight:700,color:'var(--sf-text3)'}}>الكمية</span>
              <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--sf-surface2)',borderRadius:'var(--sf-r-sm)',padding:'4px 8px',border:'1px solid var(--sf-border)'}}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:32,height:32,borderRadius:7,background:'var(--sf-surface)',border:'1px solid var(--sf-border)',cursor:'pointer',color:'var(--sf-text2)',display:'flex',alignItems:'center',justifyContent:'center'}}><Minus size={13}/></button>
                <span style={{fontSize:15,fontWeight:700,color:'var(--sf-text)',minWidth:28,textAlign:'center'}}>{qty}</span>
                <button onClick={()=>setQty(q=>Math.min(p.stock||99,q+1))} style={{width:32,height:32,borderRadius:7,background:'var(--sf-surface)',border:'1px solid var(--sf-border)',cursor:'pointer',color:'var(--sf-text2)',display:'flex',alignItems:'center',justifyContent:'center'}}><Plus size={13}/></button>
              </div>
              <span style={{fontSize:11,color:'var(--sf-text3)'}}>{p.stock} متوفر</span>
            </div>
          )}
        </div>
        {/* CTA */}
        <div style={{padding:'12px 18px 24px',background:'var(--sf-surface)',borderTop:'1px solid var(--sf-border)',position:'sticky',bottom:0}}>
          <button onClick={handleAdd} style={{width:'100%',height:52,background:added?'var(--sf-success)':'var(--sf-accent)',border:'none',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',transition:'all .2s',display:'flex',alignItems:'center',justifyContent:'center',gap:8,borderRadius:'var(--sf-r)'}}>
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

  const inp:React.CSSProperties={width:'100%',padding:'11px 14px',borderRadius:'var(--sf-r-sm)',border:'1.5px solid var(--sf-border)',background:'var(--sf-surface)',color:'var(--sf-text)',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'Tajawal,sans-serif'};

  return (
    <div style={{position:'fixed',inset:0,zIndex:400,display:'flex'}}>
      <div onClick={onClose} style={{flex:1,background:'rgba(16,24,40,.4)',backdropFilter:'blur(3px)'}}/>
      <div style={{width:'min(420px,100vw)',background:'var(--sf-surface)',display:'flex',flexDirection:'column',overflowY:'auto',boxShadow:'var(--sf-shadow-lg)'}}>
        <div style={{padding:'16px 18px',borderBottom:'1px solid var(--sf-border)',display:'flex',alignItems:'center',gap:10,position:'sticky',top:0,zIndex:2,background:'var(--sf-surface)'}}>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:8,background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',cursor:'pointer',color:'var(--sf-text2)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={16}/></button>
          <div style={{flex:1,fontSize:15,fontWeight:800,color:'var(--sf-text)'}}>{step==='cart'?`سلتك (${cart.count})`:step==='checkout'?'تأكيد الطلب':'تم الطلب ✅'}</div>
          {step==='cart'&&<span style={{fontSize:14,fontWeight:800,color:'var(--sf-accent)'}}>{cart.total.toLocaleString()} {cur}</span>}
        </div>

        {step==='cart'&&(
          <div style={{flex:1,overflow:'auto',padding:16}}>
            {cart.items.length===0?(
              <div style={{textAlign:'center',padding:'60px 20px',color:'var(--sf-text3)'}}>
                <ShoppingCart size={44} style={{margin:'0 auto 14px',opacity:.3}}/>
                <div style={{fontSize:15,fontWeight:700,color:'var(--sf-text2)',marginBottom:6}}>سلتك فارغة</div>
                <button onClick={onClose} style={{marginTop:12,padding:'9px 22px',background:'var(--sf-accent)',border:'none',borderRadius:'var(--sf-r-sm)',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:13}}>تصفح المنتجات</button>
              </div>
            ):(
              <>
                {cart.items.map((item,i)=>(
                  <div key={i} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid var(--sf-border)'}}>
                    <div style={{width:64,height:64,borderRadius:'var(--sf-r-sm)',background:'var(--sf-surface2)',overflow:'hidden',flexShrink:0,border:'1px solid var(--sf-border)'}}>
                      {item.product.imageUrl?<img src={item.product.imageUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>{item.product.emoji||'📦'}</div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--sf-text)'}}>{item.product.name}</div>
                      <div style={{fontSize:11,color:'var(--sf-text3)',marginTop:2}}>{item.size&&`${item.size}`}{item.color&&` · ${item.color}`}</div>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--sf-surface2)',borderRadius:8,padding:'3px 6px',border:'1px solid var(--sf-border)'}}>
                          <button onClick={()=>cart.update(item.product.id,item.size,item.color,item.quantity-1)} style={{width:24,height:24,borderRadius:6,background:'var(--sf-surface)',border:'1px solid var(--sf-border)',cursor:'pointer',color:'var(--sf-text2)',display:'flex',alignItems:'center',justifyContent:'center'}}><Minus size={10}/></button>
                          <span style={{fontSize:13,fontWeight:700,color:'var(--sf-text)',minWidth:20,textAlign:'center'}}>{item.quantity}</span>
                          <button onClick={()=>cart.update(item.product.id,item.size,item.color,item.quantity+1)} style={{width:24,height:24,borderRadius:6,background:'var(--sf-surface)',border:'1px solid var(--sf-border)',cursor:'pointer',color:'var(--sf-text2)',display:'flex',alignItems:'center',justifyContent:'center'}}><Plus size={10}/></button>
                        </div>
                        <span style={{fontSize:14,fontWeight:700,color:'var(--sf-accent)'}}>{(item.product.price*item.quantity).toLocaleString()} {cur}</span>
                      </div>
                    </div>
                    <button onClick={()=>cart.remove(item.product.id,item.size,item.color)} style={{width:26,height:26,borderRadius:6,background:'#FEF2F2',border:'none',cursor:'pointer',color:'var(--sf-danger)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}><X size={12}/></button>
                  </div>
                ))}
                <div style={{padding:'14px 0',marginTop:8}}>
                  <button onClick={()=>setStep('checkout')} style={{width:'100%',height:50,background:'var(--sf-accent)',border:'none',borderRadius:'var(--sf-r)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
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
                <div style={{position:'absolute',top:'100%',right:0,left:0,background:'var(--sf-surface)',border:'1px solid var(--sf-border)',borderRadius:'var(--sf-r-sm)',maxHeight:180,overflowY:'auto',zIndex:10,marginTop:4,boxShadow:'var(--sf-shadow-md)'}}>
                  {filteredCities.map(city=>(
                    <div key={city} onClick={()=>{setForm(f=>({...f,city}));setCitySearch(city);setShowCities(false);}} style={{padding:'9px 14px',fontSize:13,color:'var(--sf-text)',cursor:'pointer',borderBottom:'1px solid var(--sf-border)'}} onMouseOver={e=>(e.currentTarget.style.background='var(--sf-surface2)')} onMouseOut={e=>(e.currentTarget.style.background='')}>{city}</div>
                  ))}
                </div>
              )}
            </div>
            <textarea style={{...inp,resize:'none'} as any} placeholder="العنوان بالتفصيل" rows={2} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/>
            <textarea style={{...inp,resize:'none'} as any} placeholder="ملاحظة للبائع (اختياري)" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'var(--sf-text3)',marginBottom:8}}>طريقة الدفع</div>
              <div style={{display:'flex',gap:8}}>
                {[['cod','💵 عند الاستلام'],['virement','🏦 تحويل بنكي']].map(([v,l])=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,paymentMethod:v as any}))} style={{flex:1,padding:'10px',borderRadius:'var(--sf-r-sm)',border:`1.5px solid ${form.paymentMethod===v?'var(--sf-accent)':'var(--sf-border)'}`,background:form.paymentMethod===v?'var(--sf-accent-soft)':'var(--sf-surface)',color:form.paymentMethod===v?'var(--sf-accent)':'var(--sf-text2)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:'var(--sf-text3)',marginBottom:8}}>كود الخصم</div>
              <div style={{display:'flex',gap:8}}>
                <input style={{...inp,flex:1,textTransform:'uppercase'}} placeholder="أدخل كود الخصم" value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setCouponMsg('');}} dir="ltr"/>
                <button onClick={applyCoupon} style={{padding:'0 14px',borderRadius:'var(--sf-r-sm)',background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',color:'var(--sf-text2)',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}}>تطبيق</button>
              </div>
              {couponMsg&&<div style={{fontSize:11,marginTop:4,color:couponDiscount>0?'var(--sf-success)':'var(--sf-danger)',fontWeight:700}}>{couponMsg}</div>}
            </div>
            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:13,color:'var(--sf-text2)'}}>
              <input type="checkbox" checked={form.subscribe} onChange={e=>setForm(f=>({...f,subscribe:e.target.checked}))} style={{accentColor:'var(--sf-accent)',width:16,height:16}}/>
              أريد استقبال العروض عبر واتساب
            </label>
            <div style={{background:'var(--sf-surface2)',borderRadius:'var(--sf-r)',padding:'14px 16px',border:'1px solid var(--sf-border)'}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--sf-text3)',marginBottom:10}}>ملخص الطلب</div>
              {cart.items.map((item,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--sf-text2)',marginBottom:5,gap:8}}>
                  <span style={{flex:1}}>{item.product.name}{item.size?` (${item.size})`:''} ×{item.quantity}</span>
                  <span style={{flexShrink:0,fontWeight:700}}>{(item.product.price*item.quantity).toLocaleString()} {cur}</span>
                </div>
              ))}
              <div style={{paddingTop:8,borderTop:'1px solid var(--sf-border)',marginTop:8,display:'flex',flexDirection:'column',gap:5}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--sf-text2)'}}><span>المجموع</span><span>{cart.total.toLocaleString()} {cur}</span></div>
                {couponDiscount>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--sf-success)',fontWeight:700}}><span>الخصم</span><span>-{couponDiscount.toLocaleString()} {cur}</span></div>}
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--sf-text2)'}}><span>التوصيل — {form.city||'—'}</span><span>{form.city?`${deliveryCost} ${cur}`:'بعد المدينة'}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:800,color:'var(--sf-text)',paddingTop:8,marginTop:4,borderTop:'1px solid var(--sf-border)'}}><span>الإجمالي</span><span style={{color:'var(--sf-accent)'}}>{grandTotal.toLocaleString()} {cur}</span></div>
              </div>
            </div>
            <button onClick={handleOrder} disabled={loading} style={{width:'100%',height:52,background:'#25D366',border:'none',borderRadius:'var(--sf-r)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:loading?.7:1}}>
              {loading?'⟳ جارٍ إرسال الطلب...':<><MessageCircle size={16}/> تأكيد الطلب عبر واتساب</>}
            </button>
            <button onClick={()=>setStep('cart')} style={{background:'none',border:'none',color:'var(--sf-text3)',cursor:'pointer',fontSize:13,padding:'4px',textAlign:'center'}}>← رجوع للسلة</button>
          </div>
        )}

        {step==='success'&&(
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:'var(--sf-success-soft)',border:'2px solid var(--sf-success)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
              <Check size={36} color="var(--sf-success)"/>
            </div>
            <h2 style={{fontSize:22,fontWeight:800,color:'var(--sf-text)',marginBottom:10}}>تم إرسال طلبك! 🎉</h2>
            <p style={{fontSize:14,color:'var(--sf-text2)',lineHeight:1.7,marginBottom:24}}>تم إرسال تفاصيل طلبك عبر واتساب.<br/>سيتواصل معك البائع لتأكيد الطلب.</p>
            {orderId&&<div style={{fontSize:12,color:'var(--sf-text3)',background:'var(--sf-surface2)',borderRadius:8,padding:'6px 14px',marginBottom:20,border:'1px solid var(--sf-border)'}}>رقم الطلب: {orderId}</div>}
            <button onClick={onClose} style={{padding:'11px 28px',background:'var(--sf-accent)',border:'none',borderRadius:'var(--sf-r-sm)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>متابعة التسوق</button>
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
  const STATUS_COLOR:Record<string,string>={pending:'#D97706',approved:'#16A34A',processing:'#D97706',shipped:'#16A34A',delivered:'#16A34A',cancelled:'#E5484D'};

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
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(16,24,40,.45)',backdropFilter:'blur(4px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--sf-surface)',borderRadius:'var(--sf-r)',width:'100%',maxWidth:440,padding:24,boxShadow:'var(--sf-shadow-lg)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:'var(--sf-text)'}}>📦 تتبع طلبك</h2>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',cursor:'pointer',color:'var(--sf-text2)',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:12}}>
          {[['code','🔑 كود التتبع'],['phone','📱 رقم الهاتف']].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m as any);setQuery('');setSearched(false);setSingleOrder(null);setOrders([]);}} style={{flex:1,padding:'8px',borderRadius:'var(--sf-r-sm)',border:`1.5px solid ${mode===m?'var(--sf-accent)':'var(--sf-border)'}`,background:mode===m?'var(--sf-accent-soft)':'var(--sf-surface)',color:mode===m?'var(--sf-accent)':'var(--sf-text3)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          <input placeholder={mode==='code'?'أدخل كودك مثل: AB12CD':'أدخل رقم هاتفك'} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} dir="ltr"
            style={{flex:1,padding:'10px 14px',borderRadius:'var(--sf-r-sm)',border:'1.5px solid var(--sf-border)',background:'var(--sf-surface)',color:'var(--sf-text)',fontSize:13,outline:'none',textTransform:mode==='code'?'uppercase':'none',fontFamily:'Tajawal,sans-serif'}}/>
          <button onClick={search} disabled={loading} style={{padding:'8px 18px',background:'var(--sf-accent)',border:'none',borderRadius:'var(--sf-r-sm)',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:14,flexShrink:0}}>{loading?'⟳':'بحث'}</button>
        </div>
        {searched&&!singleOrder&&orders.length===0&&<p style={{color:'var(--sf-text3)',textAlign:'center',fontSize:13,padding:'12px 0'}}>لم نجد طلبات</p>}
        {singleOrder&&(
          <div style={{background:'var(--sf-success-soft)',border:'1px solid #BBF7D0',borderRadius:'var(--sf-r-sm)',padding:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:14,fontWeight:800,color:'var(--sf-text)'}}>طلبك</span>
              <span style={{fontSize:13,fontWeight:800,color:STATUS_COLOR[singleOrder.status]||'var(--sf-text2)'}}>{STATUS_AR[singleOrder.status]||singleOrder.status}</span>
            </div>
            {(singleOrder.items||[]).map((item:any,i:number)=><div key={i} style={{fontSize:12,color:'var(--sf-text2)',marginBottom:3}}>• {item.productName} × {item.quantity}</div>)}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8,paddingTop:8,borderTop:'1px solid #BBF7D0'}}>
              <span style={{fontSize:11,color:'var(--sf-text3)'}}>{singleOrder.city}</span>
              <span style={{fontSize:14,fontWeight:700,color:'var(--sf-accent)'}}>{singleOrder.total} {cur}</span>
            </div>
          </div>
        )}
        {orders.map((o:any)=>(
          <div key={o.id} style={{background:'var(--sf-surface2)',borderRadius:'var(--sf-r-sm)',padding:'12px 14px',marginBottom:8,border:'1px solid var(--sf-border)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontSize:10,color:'var(--sf-text3)',fontFamily:'monospace'}}>{o.id}</span>
              <span style={{fontSize:12,fontWeight:700,color:STATUS_COLOR[o.status]||'var(--sf-text2)'}}>{STATUS_AR[o.status]||o.status}</span>
            </div>
            {(o.items||[]).map((item:any,i:number)=><div key={i} style={{fontSize:12,color:'var(--sf-text2)',marginBottom:2}}>• {item.productName} x{item.quantity}</div>)}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:6,fontSize:12}}>
              <span style={{color:'var(--sf-text3)'}}>{new Date(o.createdAt).toLocaleDateString('ar-MA')}</span>
              <span style={{fontWeight:700,color:'var(--sf-accent)'}}>{o.total} {cur}</span>
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
    <button onClick={()=>setOpen(v=>!v)} style={{width:54,height:54,borderRadius:'50%',background:'var(--sf-accent)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--sf-shadow-lg)',position:'fixed',bottom:28,left:20,zIndex:200,color:'#fff',transition:'all .2s'}}>
      {open?<X size={22}/>:<Bot size={22}/>}
      {unread>0&&!open&&<div style={{position:'absolute',top:-4,right:-4,width:18,height:18,background:'var(--sf-danger)',borderRadius:'50%',fontSize:11,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff',color:'#fff'}}>{unread}</div>}
    </button>
    {open&&(
      <div style={{position:'fixed',bottom:96,left:16,right:16,maxWidth:360,marginLeft:'auto',background:'var(--sf-surface)',border:'1px solid var(--sf-border)',borderRadius:'var(--sf-r)',boxShadow:'var(--sf-shadow-lg)',zIndex:200,overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:460}}>
        <div style={{padding:'12px 16px',background:'var(--sf-accent)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center'}}><Bot size={16} color="#fff"/></div>
          <div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>مساعد {storeInfo.brand.name}</div><div style={{fontSize:10,color:'rgba(255,255,255,.8)'}}>متاح الآن</div></div>
          <button onClick={()=>setOpen(false)} style={{marginRight:'auto',background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,.85)',display:'flex'}}><X size={16}/></button>
        </div>
        <div style={{flex:1,overflow:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:8,background:'var(--sf-bg)'}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{maxWidth:'85%',alignSelf:m.role==='user'?'flex-end':'flex-start'}}>
              <div style={{padding:'8px 12px',borderRadius:m.role==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',background:m.role==='user'?'var(--sf-accent)':'var(--sf-surface)',border:m.role==='user'?'none':'1px solid var(--sf-border)',color:m.role==='user'?'#fff':'var(--sf-text)',fontSize:12,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{padding:'8px 12px',borderRadius:'14px 14px 14px 4px',background:'var(--sf-surface)',border:'1px solid var(--sf-border)',color:'var(--sf-text3)',fontSize:12,alignSelf:'flex-start'}}>يكتب...</div>}
          <div ref={endRef}/>
        </div>
        <div style={{padding:'6px 10px',display:'flex',gap:5,flexWrap:'wrap',borderTop:'1px solid var(--sf-border)'}}>
          {['اشوف المنتجات','بكام التوصيل؟','تتبع طلبي'].map(q=>(
            <button key={q} onClick={()=>send(q)} style={{fontSize:10,padding:'4px 9px',borderRadius:99,background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',color:'var(--sf-text2)',cursor:'pointer'}}>{q}</button>
          ))}
        </div>
        <div style={{padding:'8px 10px',borderTop:'1px solid var(--sf-border)',display:'flex',gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="اكتب سؤالك..."
            style={{flex:1,padding:'7px 12px',fontSize:12,borderRadius:'var(--sf-r-sm)',border:'1px solid var(--sf-border)',background:'var(--sf-surface)',color:'var(--sf-text)',outline:'none',fontFamily:'Tajawal,sans-serif'}}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:34,height:34,borderRadius:'50%',background:'var(--sf-accent)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',opacity:(!input.trim()||loading)?.5:1}}><Send size={14} color="#fff"/></button>
        </div>
      </div>
    )}
  </>);
}

// ─── HERO (real stats only) ───────────────────────────────────────────────────
function HeroSection({brand,productCount,serviceCount,totalSales,onShop,onServices}:{brand:StoreInfo['brand'];productCount:number;serviceCount:number;totalSales:number;onShop:()=>void;onServices:()=>void}) {
  const hasServices=serviceCount>0;
  const stats=[{n:productCount,l:'منتج'}];
  if(hasServices) stats.push({n:serviceCount,l:'خدمة'});
  if(totalSales>0) stats.push({n:totalSales,l:'مبيعة'});
  return (
    <div style={{background:'var(--sf-surface)',borderBottom:'1px solid var(--sf-border)',padding:'24px 20px 20px'}}>
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:18}}>
        <div style={{flexShrink:0,width:72,height:72,borderRadius:18,overflow:'hidden',background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
            :<span style={{fontSize:28,fontWeight:800,color:'var(--sf-accent)'}}>{brand.name?.[0]?.toUpperCase()||'S'}</span>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <h1 style={{fontSize:'clamp(20px,5vw,26px)',fontWeight:800,color:'var(--sf-text)',margin:'0 0 4px',lineHeight:1.2}}>{brand.name||'المتجر'}</h1>
          {brand.description&&<p style={{fontSize:13,color:'var(--sf-text2)',margin:'0 0 8px',lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{brand.description}</p>}
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'4px 11px',borderRadius:99,background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',color:'var(--sf-text2)',fontSize:11,fontWeight:600,textDecoration:'none'}}>💬 واتساب</a>}
            {brand.instagram&&<a href={`https://instagram.com/${brand.instagram}`} target="_blank" rel="noreferrer" style={{padding:'4px 11px',borderRadius:99,background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',color:'var(--sf-text2)',fontSize:11,fontWeight:600,textDecoration:'none'}}>📸 Instagram</a>}
            {brand.facebook&&<a href={`https://facebook.com/${brand.facebook}`} target="_blank" rel="noreferrer" style={{padding:'4px 11px',borderRadius:99,background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',color:'var(--sf-text2)',fontSize:11,fontWeight:600,textDecoration:'none'}}>📘 Facebook</a>}
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:10,marginBottom:16}}>
        <button onClick={onShop} style={{flex:1,height:46,borderRadius:'var(--sf-r)',background:'var(--sf-accent)',border:'none',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          <ShoppingCart size={16}/> تسوق الآن
        </button>
        {hasServices&&<button onClick={onServices} style={{flex:1,height:46,borderRadius:'var(--sf-r)',background:'var(--sf-surface)',border:'1.5px solid var(--sf-border)',color:'var(--sf-text)',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
          🔧 الخدمات
        </button>}
      </div>
      {/* Real stats */}
      <div style={{display:'flex',background:'var(--sf-surface2)',borderRadius:'var(--sf-r)',padding:'12px',border:'1px solid var(--sf-border)'}}>
        {stats.map((s,i)=>(
          <div key={i} style={{flex:1,textAlign:'center',borderLeft:i>0?'1px solid var(--sf-border)':'none'}}>
            <div style={{fontSize:19,fontWeight:800,color:'var(--sf-text)'}}>{s.n.toLocaleString()}</div>
            <div style={{fontSize:11,color:'var(--sf-text3)',fontWeight:600,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCROLL TO TOP ────────────────────────────────────────────────────────────
function ScrollToTop() {
  const [show,setShow]=useState(false);
  useEffect(()=>{const h=()=>setShow(window.scrollY>400);window.addEventListener('scroll',h);return()=>window.removeEventListener('scroll',h);},[]);
  if(!show)return null;
  return (
    <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{position:'fixed',bottom:100,right:20,zIndex:150,width:42,height:42,borderRadius:'50%',background:'var(--sf-surface)',border:'1px solid var(--sf-border)',color:'var(--sf-accent)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--sf-shadow-md)',transition:'all .2s'}}><ChevronUp size={18}/></button>
  );
}

// ─── FILTER DRAWER ────────────────────────────────────────────────────────────
function FilterDrawer({onClose,priceMin,priceMax,setPriceMin,setPriceMax,typeFilter,setTypeFilter,sortBy,setSortBy,maxP}:{onClose:()=>void;priceMin:number;priceMax:number;setPriceMin:(v:number)=>void;setPriceMax:(v:number)=>void;typeFilter:string;setTypeFilter:(v:string)=>void;sortBy:string;setSortBy:(v:any)=>void;maxP:number}) {
  const [lMin,setLMin]=useState(priceMin);
  const [lMax,setLMax]=useState(priceMax||maxP);
  const apply=()=>{setPriceMin(lMin);setPriceMax(lMax>=maxP?0:lMax);onClose();};
  const reset=()=>{setLMin(0);setLMax(maxP);setPriceMin(0);setPriceMax(0);setTypeFilter('all');onClose();};
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(16,24,40,.4)',backdropFilter:'blur(3px)',zIndex:400,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:520,background:'var(--sf-surface)',borderRadius:'20px 20px 0 0',padding:'20px 20px 32px',boxShadow:'var(--sf-shadow-lg)'}}>
        <div style={{width:40,height:4,background:'var(--sf-border2)',borderRadius:99,margin:'0 auto 18px'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{fontSize:16,fontWeight:800,color:'var(--sf-text)',display:'flex',alignItems:'center',gap:8}}><SlidersHorizontal size={16} color="var(--sf-accent)"/> الفلاتر</h3>
          <button onClick={reset} style={{fontSize:12,color:'var(--sf-accent)',background:'var(--sf-accent-soft)',border:'1px solid var(--sf-accent-border)',cursor:'pointer',fontWeight:700,padding:'5px 12px',borderRadius:8}}>إعادة تعيين</button>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--sf-text3)',marginBottom:10}}>نوع المنتج</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[['all','🛍️ الكل'],['product','📦 منتجات'],['service','🔧 خدمات'],['digital','💻 رقمي']].map(([v,l])=>(
              <button key={v} onClick={()=>setTypeFilter(v)} style={{padding:'7px 14px',borderRadius:99,border:`1.5px solid ${typeFilter===v?'var(--sf-accent)':'var(--sf-border)'}`,background:typeFilter===v?'var(--sf-accent-soft)':'var(--sf-surface)',color:typeFilter===v?'var(--sf-accent)':'var(--sf-text2)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--sf-text3)',marginBottom:10}}>السعر: <span style={{color:'var(--sf-accent)'}}>{lMin} — {lMax>=maxP?'∞':lMax}</span></div>
          <div style={{display:'flex',gap:12}}>
            <div style={{flex:1}}><div style={{fontSize:10,color:'var(--sf-text3)',marginBottom:4}}>من</div><input type="range" min={0} max={maxP} step={10} value={lMin} onChange={e=>setLMin(Math.min(+e.target.value,lMax-10))} style={{width:'100%',accentColor:'var(--sf-accent)'}}/></div>
            <div style={{flex:1}}><div style={{fontSize:10,color:'var(--sf-text3)',marginBottom:4}}>إلى</div><input type="range" min={0} max={maxP} step={10} value={lMax} onChange={e=>setLMax(Math.max(+e.target.value,lMin+10))} style={{width:'100%',accentColor:'var(--sf-accent)'}}/></div>
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--sf-text3)',marginBottom:10}}>الترتيب</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[['popular','🔥 الأكثر طلباً'],['newest','✨ الأحدث'],['price-asc','💰 الأقل سعراً'],['price-desc','💎 الأعلى سعراً']].map(([v,l])=>(
              <button key={v} onClick={()=>setSortBy(v)} style={{padding:'7px 12px',borderRadius:99,border:`1.5px solid ${sortBy===v?'var(--sf-accent)':'var(--sf-border)'}`,background:sortBy===v?'var(--sf-accent-soft)':'var(--sf-surface)',color:sortBy===v?'var(--sf-accent)':'var(--sf-text2)',fontSize:12,fontWeight:700,cursor:'pointer'}}>{l}</button>
            ))}
          </div>
        </div>
        <button onClick={apply} style={{width:'100%',height:48,background:'var(--sf-accent)',border:'none',borderRadius:'var(--sf-r)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>تطبيق</button>
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
  void successOrderId;

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
  // Related products dispatch listener
  useEffect(()=>{
    const h=(e:any)=>{if(e.detail)setViewProduct(e.detail);};
    document.addEventListener('viewProduct',h);return()=>document.removeEventListener('viewProduct',h);
  },[]);

  const trackViewed=useCallback((p:SProduct)=>{
    try{const k=`sahar_viewed_${userId}`;const prev:string[]=JSON.parse(localStorage.getItem(k)||'[]');localStorage.setItem(k,JSON.stringify([p.id,...prev.filter(id=>id!==p.id)].slice(0,20)));}catch{}
  },[userId]);

  const allProducts=products.filter(p=>(!p.type||p.type==='product'));
  const allServices=products.filter(p=>p.type==='service');
  const allDigital=products.filter(p=>p.type==='digital');
  const categories=['all',...Array.from(new Set(products.map(p=>p.category).filter(Boolean)))];
  // Real aggregate: total units sold across catalog
  const totalSales=useMemo(()=>products.reduce((s,p)=>s+(p.sales||0),0),[products]);

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

  // ── Loading
  if(loading) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'var(--sf-bg)',padding:16,fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <style>{`@keyframes sfshim{0%{background-position:200% 0}100%{background-position:-200% 0}}.sfsk{background:linear-gradient(90deg,#ECECF0 25%,#F6F7F9 50%,#ECECF0 75%);background-size:200% 100%;animation:sfshim 1.4s infinite;border-radius:10px;}`}</style>
      <div style={{height:48,borderRadius:14,marginBottom:12}} className="sfsk"/>
      <div style={{height:130,borderRadius:18,marginBottom:14}} className="sfsk"/>
      <div style={{height:36,borderRadius:99,marginBottom:14}} className="sfsk"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} style={{borderRadius:14,overflow:'hidden',border:'1px solid #ECECF0'}}><div style={{aspectRatio:'1/1'}} className="sfsk"/><div style={{padding:'10px 12px',display:'flex',flexDirection:'column',gap:6}}><div style={{height:10,width:'60%'}} className="sfsk"/><div style={{height:14,width:'90%'}} className="sfsk"/><div style={{height:18,width:'40%'}} className="sfsk"/></div></div>
        ))}
      </div>
    </div>
  );

  if(!userId) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'var(--sf-bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center',gap:16,fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <div style={{fontSize:56}}>🏪</div>
      <div style={{fontSize:22,fontWeight:800,color:'var(--sf-text)'}}>متجر SAHAR Shop</div>
      <div style={{fontSize:14,color:'var(--sf-text3)',maxWidth:320,lineHeight:1.8}}>اطلب من التاجر مشاركة رابط متجره الخاص معك.</div>
      <a href="/" style={{padding:'10px 24px',background:'var(--sf-accent)',borderRadius:'var(--sf-r-sm)',color:'#fff',fontWeight:700,fontSize:14,textDecoration:'none'}}>الصفحة الرئيسية</a>
    </div>
  );

  if(error||(!loading&&!storeInfo)) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'var(--sf-bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--sf-text2)',textAlign:'center',padding:24,fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <div><div style={{fontSize:40,marginBottom:16}}>🏪</div><div style={{fontSize:18,fontWeight:700,color:'var(--sf-text)',marginBottom:8}}>المتجر غير موجود</div><div style={{fontSize:14}}>{error||'تحقق من الرابط'}</div></div>
    </div>
  );

  const brand=storeInfo!.brand;
  const cur=brand.currency||'MAD';
  const openStatus=storeOpenStatus(brand.workStart,brand.workEnd);
  const minDel=minDeliveryCost(storeInfo!.deliveryCosts);

  if(!loading&&!error&&storeInfo&&products.length===0) return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'var(--sf-bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',textAlign:'center',fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <div style={{width:72,height:72,borderRadius:18,overflow:'hidden',background:'var(--sf-surface)',border:'1px solid var(--sf-border)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,boxShadow:'var(--sf-shadow)'}}>
        {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<span style={{fontSize:32}}>🏪</span>}
      </div>
      <h1 style={{fontSize:24,fontWeight:800,color:'var(--sf-text)',marginBottom:8}}>{brand.name||'المتجر'}</h1>
      <div style={{fontSize:60,margin:'20px 0 14px'}}>📦</div>
      <h2 style={{fontSize:18,fontWeight:700,color:'var(--sf-text)',marginBottom:8}}>المتجر قيد التجهيز</h2>
      <p style={{fontSize:14,color:'var(--sf-text3)',maxWidth:300,lineHeight:1.8,marginBottom:28}}>ستضاف المنتجات قريباً — تابعونا!</p>
      {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'12px 24px',borderRadius:'var(--sf-r)',background:'#25D366',color:'#fff',fontSize:14,fontWeight:700,textDecoration:'none'}}>💬 تواصل معنا</a>}
    </div>
  );

  const bestSellers=[...products].sort((a,b)=>(b.sales||0)-(a.sales||0)).slice(0,6).filter(p=>(p.sales||0)>0);
  const recentlyViewedIds:string[]=JSON.parse(localStorage.getItem(`sahar_viewed_${userId}`)||'[]');
  const recentlyViewed=recentlyViewedIds.slice(0,8).map(id=>products.find(p=>p.id===id)).filter(Boolean) as SProduct[];

  return (
    <div dir="rtl" style={{...SF,minHeight:'100dvh',background:'var(--sf-bg)',color:'var(--sf-text)',fontFamily:'Tajawal,system-ui,sans-serif'} as React.CSSProperties}>
      <style>{`
        body{background:#F6F7F9!important}
        .sf-input:focus{border-color:var(--sf-accent)!important;outline:none!important}
        ::-webkit-scrollbar{width:8px;height:8px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#D7D9E0;border-radius:99px}
      `}</style>

      <InfoBar status={openStatus} minDelivery={minDel} currency={cur}/>

      {/* ── HEADER */}
      <header style={{position:'sticky',top:0,zIndex:100,background:'rgba(255,255,255,0.92)',backdropFilter:'blur(10px)',borderBottom:'1px solid var(--sf-border)',padding:'0 14px',height:62,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div style={{width:38,height:38,borderRadius:10,overflow:'hidden',background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            {brand.logo?<img src={brand.logo} alt="logo" style={{width:'100%',height:'100%',objectFit:'contain'}}/>
              :<span style={{fontSize:16,fontWeight:800,color:'var(--sf-accent)'}}>{brand.name?.[0]?.toUpperCase()||'S'}</span>}
          </div>
          <div style={{fontSize:14,fontWeight:700,color:'var(--sf-text)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{brand.name}</div>
        </div>
        <div style={{flex:1,maxWidth:260,position:'relative'}}>
          <Search size={14} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',color:'var(--sf-text3)',pointerEvents:'none'}}/>
          <input className="sf-input" placeholder="ابحث..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:'100%',paddingRight:36,paddingLeft:14,height:38,borderRadius:99,border:'1.5px solid var(--sf-border)',background:'var(--sf-surface2)',color:'var(--sf-text)',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'Tajawal,sans-serif'}}/>
        </div>
        <div style={{display:'flex',gap:7,alignItems:'center',flexShrink:0}}>
          <button onClick={()=>setShowTrack(true)} style={{padding:'5px 10px',borderRadius:9,background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',color:'var(--sf-text2)',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><Package size={12}/> طلباتي</button>
          {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{padding:'5px 10px',borderRadius:9,background:'var(--sf-success-soft)',border:'1px solid #BBF7D0',color:'var(--sf-success)',fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4,textDecoration:'none'}}><MessageCircle size={12}/> واتساب</a>}
          <button onClick={()=>setShowCart(true)} style={{position:'relative',width:40,height:40,borderRadius:10,background:cartAnim?'var(--sf-accent)':'var(--sf-surface2)',border:`1px solid ${cartAnim?'var(--sf-accent)':'var(--sf-border)'}`,color:cartAnim?'#fff':'var(--sf-text2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>
            <ShoppingCart size={18}/>
            {cart.count>0&&<span style={{position:'absolute',top:-5,left:-5,width:18,height:18,background:'var(--sf-accent)',borderRadius:'50%',fontSize:10,fontWeight:900,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff'}}>{cart.count}</span>}
          </button>
        </div>
      </header>

      <HeroSection brand={brand} productCount={allProducts.length} serviceCount={allServices.length} totalSales={totalSales} onShop={()=>{setActiveTab('all');setSelectedCategory('all');}} onServices={()=>{setActiveTab('خدمات');setSelectedCategory('خدمات');}}/>

      {/* ── CATEGORY BAR */}
      <div style={{background:'var(--sf-surface)',borderBottom:'1px solid var(--sf-border)',padding:'10px 0',position:'sticky',top:62,zIndex:90}}>
        <div style={{display:'flex',gap:8,overflowX:'auto',padding:'0 14px',scrollbarWidth:'none'}}>
          {categories.map(cat=>{
            const count=cat==='all'?products.length:products.filter(p=>p.category===cat).length;
            const EMOJI_MAP:Record<string,string>={'أحذية':'👟','ملابس نسائية':'👗','نسائي':'👗','ملابس رجالية':'👔','رجالي':'👔','أطفال':'👶','إكسسوارات':'💍','هدايا':'🎁','إلكترونيات':'📱','طعام':'🍽️','خدمات':'🔧'};
            const emoji=Object.entries(EMOJI_MAP).find(([k])=>cat.includes(k))?.[1]||(cat==='all'?'🛍️':'🏷️');
            const active=activeTab===cat;
            return (
              <button key={cat} onClick={()=>{setActiveTab(cat);setSelectedCategory(cat);}}
                style={{flexShrink:0,padding:'7px 14px',borderRadius:99,fontSize:12,fontWeight:700,cursor:'pointer',
                  border:`1.5px solid ${active?'var(--sf-accent)':'var(--sf-border)'}`,
                  background:active?'var(--sf-accent)':'var(--sf-surface)',
                  color:active?'#fff':'var(--sf-text2)',transition:'all .15s',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap'}}>
                <span>{emoji}</span>{cat==='all'?'الكل':cat}<span style={{fontSize:10,opacity:.7,fontWeight:500}}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SEARCH + FILTER ROW */}
      <div style={{padding:'12px 14px 0',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <span style={{fontSize:12,color:'var(--sf-text3)',fontWeight:600}}>
          {filteredProducts.length+filteredServices.length+filteredDigital.length} نتيجة
          {hasActiveFilter&&<button onClick={()=>{setPriceMin(0);setPriceMax(0);setTypeFilter('all');}} style={{marginRight:6,fontSize:10,color:'var(--sf-accent)',background:'var(--sf-accent-soft)',border:'none',borderRadius:99,padding:'2px 8px',cursor:'pointer',fontWeight:700}}>× مسح</button>}
        </span>
        <div style={{display:'flex',gap:6}}>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} style={{background:'var(--sf-surface)',border:'1px solid var(--sf-border)',borderRadius:9,padding:'5px 10px',color:'var(--sf-text2)',fontSize:12,cursor:'pointer',outline:'none'}}>
            <option value="popular">الأكثر طلباً</option>
            <option value="newest">الأحدث</option>
            <option value="price-asc">الأقل سعراً</option>
            <option value="price-desc">الأعلى سعراً</option>
          </select>
          <button onClick={()=>setShowFilters(true)} style={{width:36,height:36,borderRadius:9,background:hasActiveFilter?'var(--sf-accent)':'var(--sf-surface)',border:`1px solid ${hasActiveFilter?'var(--sf-accent)':'var(--sf-border)'}`,color:hasActiveFilter?'#fff':'var(--sf-text2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
            <Filter size={14}/>
            {hasActiveFilter&&<span style={{position:'absolute',top:-4,right:-4,width:10,height:10,background:'var(--sf-danger)',borderRadius:'50%',border:'2px solid #fff'}}/>}
          </button>
        </div>
      </div>

      <div style={{padding:'14px 14px 110px'}}>
        {/* ── BEST SELLERS (real) */}
        {bestSellers.length>=2&&!search&&activeTab==='all'&&(
          <div style={{marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <Flame size={16} color="var(--sf-accent)"/>
              <span style={{fontSize:15,fontWeight:800,color:'var(--sf-text)'}}>الأكثر مبيعاً</span>
            </div>
            <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:6,scrollbarWidth:'none'}}>
              {bestSellers.map((p,idx)=>(
                <div key={p.id} onClick={()=>{trackViewed(p);setViewProduct(p);}} style={{flexShrink:0,width:200,borderRadius:'var(--sf-r)',overflow:'hidden',cursor:'pointer',background:'var(--sf-surface)',border:'1px solid var(--sf-border)',boxShadow:'var(--sf-shadow)',transition:'all .2s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow='var(--sf-shadow-md)';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow='var(--sf-shadow)';(e.currentTarget as HTMLElement).style.transform='';}}>
                  <div style={{height:110,position:'relative',background:'var(--sf-surface2)',overflow:'hidden'}}>
                    {p.imageUrl?<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40}}>{p.emoji||'📦'}</div>}
                    <span style={{position:'absolute',top:8,right:8,background:'var(--sf-accent)',color:'#fff',fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:99}}>#{idx+1}</span>
                  </div>
                  <div style={{padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><div style={{fontSize:12,fontWeight:600,color:'var(--sf-text)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',maxWidth:110}}>{p.name}</div><div style={{fontSize:10,color:'var(--sf-text3)'}}>{p.sales} مبيع</div></div>
                    <div style={{fontSize:15,fontWeight:800,color:'var(--sf-text)',flexShrink:0}}>{p.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PRODUCTS */}
        {filteredProducts.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:3,height:20,background:'var(--sf-accent)',borderRadius:99}}/>
              <span style={{fontSize:16,fontWeight:800,color:'var(--sf-text)'}}>منتجاتنا</span>
              <span style={{fontSize:11,color:'var(--sf-text3)',background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',padding:'2px 9px',borderRadius:99}}>{filteredProducts.length}</span>
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
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:3,height:20,background:'#16181D',borderRadius:99}}/>
              <span style={{fontSize:16,fontWeight:800,color:'var(--sf-text)'}}>خدماتنا</span>
              <span style={{fontSize:11,color:'var(--sf-text3)',background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',padding:'2px 9px',borderRadius:99}}>{filteredServices.length}</span>
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
          <div style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <div style={{width:3,height:20,background:'#16181D',borderRadius:99}}/>
              <span style={{fontSize:16,fontWeight:800,color:'var(--sf-text)'}}>المنتجات الرقمية</span>
              <span style={{fontSize:11,color:'var(--sf-text3)',background:'var(--sf-surface2)',border:'1px solid var(--sf-border)',padding:'2px 9px',borderRadius:99}}>{filteredDigital.length}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:14}}>
              {filteredDigital.map(p=><ProductCard key={p.id} p={p} currency={cur} onAdd={handleAddToCart} onView={p=>{trackViewed(p);setViewProduct(p);}}/>)}
            </div>
          </div>
        )}

        {/* ── RECENTLY VIEWED (real localStorage) */}
        {recentlyViewed.length>0&&!search&&(
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <Eye size={14} color="var(--sf-text3)"/>
              <span style={{fontSize:13,fontWeight:700,color:'var(--sf-text2)'}}>شاهدتها مؤخراً</span>
            </div>
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,scrollbarWidth:'none'}}>
              {recentlyViewed.filter(p=>!viewProduct||p.id!==viewProduct.id).slice(0,6).map(p=>(
                <div key={p.id} onClick={()=>{trackViewed(p);setViewProduct(p);}} style={{flexShrink:0,width:90,borderRadius:'var(--sf-r-sm)',overflow:'hidden',cursor:'pointer',background:'var(--sf-surface)',border:'1px solid var(--sf-border)'}}>
                  <div style={{height:72,background:'var(--sf-surface2)',overflow:'hidden'}}>
                    {p.imageUrl?<img src={p.imageUrl} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy"/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{p.emoji||'📦'}</div>}
                  </div>
                  <div style={{padding:'5px 7px'}}><div style={{fontSize:10,fontWeight:600,color:'var(--sf-text)',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{p.name}</div><div style={{fontSize:11,fontWeight:800,color:'var(--sf-text)'}}>{p.price.toLocaleString()}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EMPTY */}
        {filteredProducts.length===0&&filteredServices.length===0&&filteredDigital.length===0&&(search||hasActiveFilter)&&(
          <div style={{textAlign:'center',padding:'60px 20px',background:'var(--sf-surface)',borderRadius:'var(--sf-r)',border:'1px solid var(--sf-border)'}}>
            <Package size={48} style={{margin:'0 auto 16px',opacity:.25,color:'var(--sf-text3)'}}/>
            <div style={{fontSize:16,fontWeight:700,color:'var(--sf-text2)',marginBottom:8}}>لم نجد نتائج</div>
            <div style={{fontSize:13,color:'var(--sf-text3)',marginBottom:16}}>جرب كلمة أخرى أو امسح الفلاتر</div>
            <button onClick={()=>{setSearch('');setPriceMin(0);setPriceMax(0);setTypeFilter('all');setActiveTab('all');setSelectedCategory('all');}} style={{padding:'9px 22px',background:'var(--sf-accent)',border:'none',borderRadius:'var(--sf-r-sm)',color:'#fff',cursor:'pointer',fontWeight:700,fontSize:13}}>مسح الكل</button>
          </div>
        )}

        {/* ── FOOTER */}
        <div style={{marginTop:40,paddingTop:24,borderTop:'1px solid var(--sf-border)',textAlign:'center'}}>
          <div style={{fontSize:12,color:'var(--sf-text2)',marginBottom:8,fontWeight:700}}>{brand.name}</div>
          {brand.address&&<div style={{fontSize:11,color:'var(--sf-text3)',marginBottom:10}}>📍 {brand.address}</div>}
          <div style={{display:'flex',justifyContent:'center',gap:14,marginBottom:14}}>
            {brand.phone&&<a href={`https://wa.me/${brand.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{fontSize:12,color:'var(--sf-success)',fontWeight:700,textDecoration:'none'}}>💬 واتساب</a>}
            {brand.instagram&&<a href={`https://instagram.com/${brand.instagram}`} target="_blank" rel="noreferrer" style={{fontSize:12,color:'#E1306C',fontWeight:700,textDecoration:'none'}}>📸 Instagram</a>}
            {brand.facebook&&<a href={`https://facebook.com/${brand.facebook}`} target="_blank" rel="noreferrer" style={{fontSize:12,color:'#1877F2',fontWeight:700,textDecoration:'none'}}>📘 Facebook</a>}
          </div>
          <div style={{fontSize:10,color:'var(--sf-text3)',opacity:.7}}>Powered by SAHAR Shop 🇲🇦</div>
        </div>
      </div>

      {/* ── STICKY CART */}
      {cart.count>0&&!showCart&&(
        <div style={{position:'fixed',bottom:20,right:14,left:14,zIndex:150}}>
          <button onClick={()=>setShowCart(true)} style={{width:'100%',height:52,background:'var(--sf-accent)',border:'none',borderRadius:'var(--sf-r)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:'var(--sf-shadow-lg)'}}>
            <ShoppingCart size={18}/>
            السلة ({cart.count})
            <span style={{background:'rgba(255,255,255,.2)',borderRadius:99,padding:'2px 12px',fontSize:13,fontWeight:800}}>{cart.total.toLocaleString()} {cur}</span>
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