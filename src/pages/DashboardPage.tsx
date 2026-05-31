import React from 'react';
import { useStore } from '../store';
import {
  ShoppingBag, MessageCircle, Users,
  ChevronRight, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';

const STATUS_AR: Record<string,string> = {
  pending:'بانتظار',approved:'موافقة',processing:'جارٍ',
  shipped:'شُحن',delivered:'وُصّل',cancelled:'ملغي',
};


function AIGreeting() {
  const { settings, orders, conversations } = useStore();
  const pending = orders.filter(o=>o.status==='pending').length;
  const unread = conversations.reduce((s,c)=>s+c.unread,0);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'صباح النور' : hour < 18 ? 'مرحباً' : 'مساء الخير';

  let msg = `${greet}! `;
  if (pending > 0 && unread > 0) msg += `عندك ${pending} طلب جديد و${unread} رسالة تنتظر ردك`;
  else if (pending > 0) msg += `عندك ${pending} طلب جديد يحتاج موافقتك`;
  else if (unread > 0) msg += `عندك ${unread} رسالة غير مقروءة`;
  else msg += 'كل شيء على ما يرام اليوم 👌';

  return (
    <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--r)',
      padding:'11px 14px',display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
      <div className="dot-live" />
      <span style={{fontSize:13,color:'var(--ink2)',flex:1,lineHeight:1.4}}>
        <strong style={{color:'var(--ink1)'}}>{msg.split('!')[0]}!</strong>
        {msg.split('!').slice(1).join('!')}
      </span>
      {settings.ai.humanSimulation && (
        <span style={{fontSize:10,background:'rgba(0,200,150,.1)',color:'var(--mint)',
          border:'1px solid rgba(0,200,150,.2)',borderRadius:6,padding:'3px 8px',fontWeight:700,whiteSpace:'nowrap'}}>
          AI نشط
        </span>
      )}
    </div>
  );
}

// Skeleton shown on first load for real (non-demo) users while backend data fetches
function DashboardSkeleton() {
  const pulse: React.CSSProperties = { borderRadius: 10, background: 'var(--panel2)', animation: 'pulse-ember 1.6s ease-in-out infinite' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ ...pulse, height: 44 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ ...pulse, height: 90 }} />)}
      </div>
      <div style={{ ...pulse, height: 180 }} />
      <div style={{ ...pulse, height: 140 }} />
    </div>
  );
}

export default function DashboardPage() {
  const { settings, products, orders, customers, conversations, setPage, isLoading } = useStore();
  const [showDetails, setShowDetails] = React.useState(false);

  if (isLoading) return <DashboardSkeleton />;

  const { currency } = settings.brand;
  const { goals } = settings;

  const active   = orders.filter(o=>o.status!=='cancelled');
  const revenue  = active.reduce((s,o)=>s+o.total,0);
  const today    = new Date().toISOString().split('T')[0];
  const todayRev = active.filter(o=>o.createdAt?.startsWith(today)).reduce((s,o)=>s+o.total,0);
  const pending  = orders.filter(o=>o.status==='pending').length;
  const unread   = conversations.reduce((s,c)=>s+c.unread,0);
  const low      = products.filter(p=>p.stock>0&&p.stock<=settings.products.lowStockAlert).length;
  const published= products.filter(p=>p.status==='published').length;
  const goalPct  = goals.daily>0 ? Math.min(100,Math.round((todayRev/goals.daily)*100)) : 0;

  const kpiCards = [
    {
      label:'الطلبات', value:String(active.length), unit:'طلب',
      sub:pending>0?`${pending} بانتظار ⚠`:'لا معلقة ✅',
      color:'var(--ember)', icon:ShoppingBag, page:'orders' as const, alert:pending>0,
    },
    {
      label:'الرسائل', value:String(unread||conversations.length),
      unit:unread>0?'غير مقروء':'محادثة',
      sub:settings.ai.humanSimulation?'AI نشط':'AI معطّل',
      color:'var(--gold)', icon:MessageCircle, page:'conversations' as const, alert:unread>0,
    },
    {
      label:'الزبائن', value:String(customers.length), unit:'زبون',
      sub:`${customers.filter(c=>c.vip).length} VIP`,
      color:'var(--ember)', icon:Users, page:'customers' as const,
    },
  ];

  const workflowSteps = [
    {label:'منتج',done:products.length>0},
    {label:'منشور',done:published>0},
    {label:'رسائل',done:conversations.length>0},
    {label:'AI رد',done:conversations.some(c=>c.messages.some(m=>m.role==='ai'))},
    {label:'طلب',done:orders.length>0},
    {label:'موافقة',done:orders.some(o=>o.status!=='pending'),badge:pending},
    {label:'توصيل',done:orders.some(o=>['shipped','delivered'].includes(o.status))},
  ];
  const wfPct = Math.round((workflowSteps.filter(s=>s.done).length/workflowSteps.length)*100);

  const recentOrders = [...orders]
    .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
    .slice(0,3);

  const lowStockProducts = products.filter(p => p.stock >= 0 && p.stock <= settings.products.lowStockAlert);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Empty state — new merchant with no data yet */}
      {products.length === 0 && orders.length === 0 && !isLoading && (
        <div className="card" style={{ padding: 'var(--sp-6,24px)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🚀</div>
          <h2 className="page-title" style={{ marginBottom: 6, fontSize: 18 }}>مرحباً في SAHAR shop!</h2>
          <p className="page-sub" style={{ marginBottom: 18 }}>ابدأ بإضافة أول منتج وافتح متجرك للزبائن</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setPage('products')} className="btn btn-primary">
              <span>📦</span> أضف أول منتج
            </button>
            <button onClick={() => setPage('settings')} className="btn btn-ghost">
              <span>⚙️</span> إعداد متجرك
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          onClick={() => setPage('products')}
          className="btn btn-primary"
          style={{ padding: '13px 16px', fontSize: 14, borderRadius: 12, justifyContent: 'center', gap: 8 }}
        >
          <span style={{ fontSize: 18 }}>📦</span>
          <span>إضافة منتج</span>
        </button>
        <button
          onClick={() => setPage('orders')}
          className="btn btn-ghost"
          style={{ padding: '13px 16px', fontSize: 14, borderRadius: 12, justifyContent: 'center', gap: 8, border: '1px solid var(--border2)' }}
        >
          <span style={{ fontSize: 18 }}>🛒</span>
          <span>الطلبات</span>
        </button>
      </div>

      {/* AI Greeting */}
      <AIGreeting />

      {/* Hero KPI — revenue number + today, no sparkline chart */}
      <div style={{background:'var(--ember)',borderRadius:'var(--r-lg)',padding:'22px 20px',
        position:'relative',overflow:'hidden',boxShadow:'0 4px 24px rgba(255,106,0,.3)'}}>
        {/* Zellige overlay */}
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:.07,pointerEvents:'none'}}
          viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19].map(i=>(
            <polygon key={i} points={`${i*24},0 ${i*24+12},12 ${i*24},24 ${i*24-12},12`}
              fill="rgba(255,255,255,.6)"/>
          ))}
        </svg>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,.7)',marginBottom:4}}>
            الإيراد الإجمالي
          </div>
          <div style={{fontSize:36,fontWeight:900,color:'#fff',letterSpacing:'-0.04em',lineHeight:1,marginBottom:8}}>
            {revenue.toLocaleString()} <span style={{fontSize:18,opacity:.8}}>{currency}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{fontSize:12,color:'rgba(255,255,255,.75)'}}>
              اليوم: {todayRev.toLocaleString()} {currency}
            </span>
            {goals.daily > 0 && (
              <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.15)',
                borderRadius:99,padding:'3px 10px'}}>
                <div style={{width:60,height:4,borderRadius:2,background:'rgba(255,255,255,.3)',overflow:'hidden'}}>
                  <div style={{width:`${goalPct}%`,height:'100%',background:'#fff',borderRadius:2}}/>
                </div>
                <span style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,.9)'}}>
                  {goalPct}% من الهدف
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3 KPI cards — condensed single row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        {kpiCards.map((s,i)=>(
          <button key={i} onClick={()=>setPage(s.page)} className="kpi-card"
            style={{ border: s.alert ? '1px solid rgba(255,106,0,.3)' : undefined,
              background: s.alert ? 'rgba(255,106,0,.05)' : undefined,
              padding:'10px 8px' }}>
            <div style={{display:'flex',justifyContent:'center',marginBottom:6}}>
              <div style={{width:26,height:26,borderRadius:8,background:s.alert?'rgba(255,106,0,.1)':'rgba(255,255,255,.05)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <s.icon size={13} style={{color:s.alert?'var(--ember)':'var(--ink3)'}}/>
              </div>
            </div>
            <div className="num-lg" style={{color:s.alert?'var(--ember)':'var(--ink1)',fontSize:18,textAlign:'center',marginBottom:2}}>
              {s.value}
            </div>
            <div style={{fontSize:10,color:'var(--ink3)',textAlign:'center'}}>{s.label}</div>
            {s.sub && <div style={{fontSize:9,color:s.alert?'rgba(255,106,0,.6)':'var(--ink3)',textAlign:'center',marginTop:2}}>{s.sub}</div>}
          </button>
        ))}
      </div>

      {/* Collapsible details — Workflow + Morning report */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <button
          onClick={() => setShowDetails(v => !v)}
          style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:'13px 16px',background:'none',border:'none',cursor:'pointer',
            color:'var(--ink2)',fontSize:13,fontWeight:700}}
        >
          <span>تفاصيل إضافية</span>
          {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDetails && (
          <div style={{borderTop:'1px solid var(--border)',padding:'14px 14px 16px',
            display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>

            {/* Workflow */}
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div className="section-title" style={{fontSize:12}}>مسار البيع</div>
                <span style={{fontSize:12,fontWeight:700,color:wfPct===100?'var(--mint)':'var(--ember)'}}>
                  {wfPct}%
                </span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:0}}>
                {workflowSteps.map((step,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',flex:i<workflowSteps.length-1?1:'auto'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <div style={{
                        width:20,height:20,borderRadius:'50%',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:8,fontWeight:800,border:'2px solid',
                        background:step.done?'rgba(0,200,150,.12)':'transparent',
                        borderColor:step.done?'var(--mint)':'var(--border2)',
                        color:step.done?'var(--mint)':'var(--ink3)',
                      }}>
                        {step.done?'✓':i+1}
                      </div>
                      <span style={{fontSize:7,color:step.done?'var(--mint)':'var(--ink3)',
                        whiteSpace:'nowrap',textAlign:'center'}}>{step.label}</span>
                    </div>
                    {i<workflowSteps.length-1&&(
                      <div style={{flex:1,height:2,
                        background:step.done?'var(--mint)':'var(--border2)',
                        marginTop:-10,marginRight:2,marginLeft:2}}/>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mini morning report */}
            <div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                <span style={{fontSize:14}}>🌅</span>
                <div className="section-title" style={{fontSize:12}}>ملخص الصباح</div>
              </div>
              {[
                {k:'طلبات جديدة',v:orders.filter(o=>o.createdAt?.startsWith(today)).length,unit:''},
                {k:'مخزون منخفض',v:low,unit:'منتج',warn:low>0},
                {k:'رسائل معلقة',v:unread,unit:'',warn:unread>0},
              ].map((r,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',
                  padding:'5px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
                  <span style={{fontSize:10,color:'var(--ink3)'}}>{r.k}</span>
                  <span style={{fontSize:11,fontWeight:700,
                    color:r.warn?'var(--ember2)':'var(--ink1)'}}>
                    {r.v} {r.unit}
                  </span>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Recent Orders — max 3 */}
      {recentOrders.length > 0 && (
        <div className="card">
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div className="section-title" style={{fontSize:13}}>آخر الطلبات</div>
            <button onClick={()=>setPage('orders')} style={{
              fontSize:12,color:'var(--ember)',background:'none',border:'none',
              cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontWeight:700}}>
              عرض الكل <ChevronRight size={13} />
            </button>
          </div>
          {recentOrders.map((o,i)=>{
            const initials=(o.customerName||'؟').slice(0,1);
            const avatarColors=['av-ember','av-gold','av-mint','av-muted'];
            return (
              <div key={o.id} className="data-row" onClick={()=>setPage('orders')}>
                <div className={`avatar ${avatarColors[i%4]}`}>{initials}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--ink1)'}}>{o.customerName}</div>
                  <div style={{fontSize:11,color:'var(--ink3)',marginTop:1}}>
                    {o.city||'—'} · {o.source||'مباشر'}
                  </div>
                </div>
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:14,fontWeight:800,color:'var(--ink1)',letterSpacing:'-0.02em'}}>
                    {o.total.toLocaleString()} {currency}
                  </div>
                  <div style={{marginTop:3}}>
                    <span className={`status-${o.status}`}>{STATUS_AR[o.status]||o.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Low stock alert — detailed card */}
      {lowStockProducts.length > 0 && (
        <div className="card" style={{ padding: '12px 16px', background: 'rgba(246,196,83,.06)', border: '1px solid rgba(246,196,83,.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: '#F59E0B', fontSize: 13 }}>
              {lowStockProducts.length} منتج مخزونه منخفض
            </span>
          </div>
          {lowStockProducts.slice(0, 3).map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', color: 'var(--ink2)', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
              <span>{p.emoji} {p.name}</span>
              <span style={{ color: p.stock === 0 ? 'var(--ember)' : '#F59E0B', fontWeight: 700 }}>
                {p.stock === 0 ? 'نفد' : `${p.stock} قطعة`}
              </span>
            </div>
          ))}
          {lowStockProducts.length > 3 && (
            <p style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 4 }}>+{lowStockProducts.length - 3} منتج آخر</p>
          )}
          <button onClick={() => setPage('products')} className="btn btn-sm btn-ghost" style={{ marginTop: 8, width: '100%', justifyContent: 'center', color: '#F59E0B', borderColor: 'rgba(246,196,83,.3)' }}>
            إدارة المخزون →
          </button>
        </div>
      )}

    </div>
  );
}
