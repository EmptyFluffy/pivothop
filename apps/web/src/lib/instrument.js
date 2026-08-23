/* eslint-disable */
// Physics ported verbatim from the reference; only data source + accent color changed.

export function mountInstrument(DATA,HOOKS){
  HOOKS=HOOKS||{};
  var PILL_W=108,PILL_H=24;   /* wordmark clearance zone */
  var ROLES,NEXT,GNODES,GEDGES,NODE_BY_ID,NBRS;
  /* Average glyph advance as a fraction of font-size, for the label face. Label
     widths are computed from CHARACTER COUNTS (non-negotiable #1 — no getBBox in
     the loop), so this ratio is the only thing standing in for real measurement,
     and it is per-font.

     0.6 was set for Space Grotesk and is KEPT for Instrument Sans, because it was
     re-measured rather than assumed: rendering the live labels and dividing
     observed advance by (chars x font-size) gives median 0.478 / max 0.558 at
     12.5px and median 0.509 / max 0.594 at 10.5px. Instrument Sans is the
     narrower face, so 0.6 stays a conservative UPPER bound — it over-reserves a
     little, which is the safe direction.

     Changing the sans WITHOUT re-measuring silently mis-sizes every label, and
     label width is what the edge repulsion (non-negotiable #3) keeps text clear
     of — so the symptom would be text crossing wires, not anything font-shaped. */
  var GLYPH_W=0.6;
  /* TYPOGRAPHIC MODE (the V2 landing, 2026-08-22): no wires, no dots — the
     text IS the graph, sized by match strength (the routes cloud's curve,
     in viewBox units). Physics, hit-testing and interactions are untouched:
     edges and node circles still exist and simulate; CSS hides them under
     .v2h only. Everything below gates on TYPO so any non-V2 mount renders
     byte-identically to the tuned original. */
  var TYPO=false;
  function typoSize(match){
    var m=Math.max(0,Math.min(100,match||0));
    return 12+Math.pow(m/100,1.6)*34;  // match 40 -> ~19.9, 70 -> ~31.4, 90 -> ~40.7
  }
  var LABEL_FONT='Instrument Sans, system-ui, sans-serif';

  function derive(){
    ROLES=DATA.roles; NEXT=DATA.next;
    ROLES.forEach(function(rl){rl.next=NEXT[rl.id]||[];});
    GNODES=[{id:'you',type:'you',label:DATA.originLabel,match:100}];
    ROLES.forEach(function(r){GNODES.push({id:r.id,type:'first',label:r.title,match:r.match});});
    Object.keys(NEXT).forEach(function(pid){NEXT[pid].forEach(function(k,i){GNODES.push({id:pid+'_'+i,type:'kid',label:(k.t||'').replace(/&amp;/g,'&'),match:k.m,parent:pid,slug:k.slug});});});
    GEDGES=[];
    ROLES.forEach(function(r){GEDGES.push({from:'you',to:r.id,w:r.match/100,k:'primary'});});
    Object.keys(NEXT).forEach(function(pid){NEXT[pid].forEach(function(k,i){GEDGES.push({from:pid,to:pid+'_'+i,w:k.m/100,k:'kid'});});});
    (DATA.cross||[]).forEach(function(x){GEDGES.push({from:x[0],to:x[1],w:x[2],k:'cross'});});
    (DATA.bridges||[]).forEach(function(x){GEDGES.push({from:x[0],to:x[1],w:x[2],k:'bridge'});});
    NODE_BY_ID={}; GNODES.forEach(function(n){NODE_BY_ID[n.id]=n;});
    GEDGES=GEDGES.filter(function(e){return NODE_BY_ID[e.from]&&NODE_BY_ID[e.to];});
    NBRS={}; GNODES.forEach(function(n){NBRS[n.id]=Object.create(null);});
    GEDGES.forEach(function(e){NBRS[e.from][e.to]=true;NBRS[e.to][e.from]=true;e.a=NODE_BY_ID[e.from];e.b=NODE_BY_ID[e.to];});
    GNODES.forEach(function(n){
      var t=n.label;
      if(n.type==='you'){n.lblW=PILL_W;n.lblH=PILL_H;}
      else if(n.type==='first'){
        n.fs=TYPO?typoSize(n.match):12.5;
        n.lblW=Math.max(t.length*n.fs*GLYPH_W,9*(TYPO?n.fs*0.55:9.5)*0.72)+8;
        n.lblH=TYPO?n.fs*1.76+8:30;
      }
      else{
        n.fs=TYPO?Math.max(11,typoSize(n.match)*0.82):10.5;
        n.lblW=t.length*n.fs*GLYPH_W+8;
        n.lblH=TYPO?n.fs*1.52:16;
      }
    });
  }
  TYPO=!!document.querySelector('.v2h');
  derive();
  // Real board counts (re-displayable open roles per occupation) drive the
  // "open roles" stat and the search-bar CTA; fetched once, looked up by slug.
  var boardCounts=null;
  fetch('/data/jobs-index.json').then(function(r){return r.json();}).then(function(j){boardCounts=j||{};updateRolesCTA();paintJobsCTA();}).catch(function(){boardCounts={};});
  // Skill display-name -> slug, so detail-panel chips can link to the glossary.
  var skillSlugs={};
  fetch('/data/skills-meta.json').then(function(r){return r.json();}).then(function(m){var n=(m&&m.names)||{};for(var k in n)skillSlugs[(''+n[k]).toLowerCase()]=k;}).catch(function(){});
  function updateRolesCTA(){
    if(!boardCounts)return;                       // wait for the fetch; no false flash
    var slug=DATA.originSlug,n=(slug&&boardCounts[slug])||0;
    var goSpan=document.querySelector('#goBtn span');
    if(goSpan)goSpan.textContent=n>0?(n.toLocaleString()+' open roles'):'Open the job board';
    var stat=document.getElementById('openRolesStat');
    if(stat){
      var v=stat.querySelector('.v'),l=stat.querySelector('.l');
      if(n>0){if(v)v.textContent=n.toLocaleString();if(l)l.textContent='Open roles';stat.setAttribute('href','/jobs/'+slug);}
      else{if(v)v.textContent=DATA.postings?DATA.postings.toLocaleString():'—';if(l)l.textContent='Live postings';stat.setAttribute('href','/jobs');}
    }
  }
  function hydrateStatic(){
    var q=function(x){return document.querySelector(x);};
    var lbl=q('.band-head .lbl'); if(lbl)lbl.innerHTML=DATA.personalized?('Career graph · '+DATA.originLabel+' · personalized from '+DATA.skillCount+' skills'):('Career graph · '+DATA.originLabel);
    var sc=q('.band-head .score b'); if(sc&&ROLES[0])sc.textContent=ROLES[0].match;
    var freq={};ROLES.forEach(function(r){(r.have||[]).concat(r.learn||[]).forEach(function(sk){freq[sk]=(freq[sk]||0)+1;});});
    var top=Object.keys(freq).sort(function(a,b){return freq[b]-freq[a];}).slice(0,6);
    var sk=q('.proof .sk'); if(sk){sk.innerHTML='<span class="cap">In demand across your routes</span>'+top.join(' · ');}
    var stats=document.querySelectorAll('.proof .fstat .v');
    if(stats[0])stats[0].textContent=ROLES.length;
    updateRolesCTA();   // stat[1] = real board count for this occupation (clickable)
    var role=document.getElementById('qRole'); if(role)role.placeholder=DATA.originLabel;
    var qs=document.getElementById('qSkills');
    if(qs&&document.activeElement!==qs){
      var haveFreq={};ROLES.forEach(function(r){(r.have||[]).forEach(function(sk){haveFreq[sk]=(haveFreq[sk]||0)+1;});});
      var topHave=Object.keys(haveFreq).sort(function(a,b){return haveFreq[b]-haveFreq[a];}).slice(0,3);
      if(topHave.length)qs.placeholder=topHave.join(', ')+'\u2026';
    }
  }
  function nodeRadius(n){if(n.type==='you')return 12;if(n.type==='first')return 3+n.match/24;return 3;}

  /* ══ node physics — anisotropic gravity for a wide ellipse ══ */
  var CX=450,CY=320;
  var SVG=document.getElementById('graph');
  SVG.setAttribute('viewBox','0 0 900 640'); /* the frame is FIXED — fonts and center never change; walls keep content inside */
  var NS='http://www.w3.org/2000/svg';
  var REPULSE=3600,CENTER_GX=0.00045,CENTER_GY=0.00105;
  var IDEAL={primary:150,kid:92,cross:240,bridge:170};

  function seedRing(){
    var you=NODE_BY_ID['you'];
    you.x=CX;you.y=CY;you.vx=0;you.vy=0;you.fixed=true;
    var firstHop=GNODES.filter(function(n){return n.type==='first';});
    firstHop.forEach(function(n,i){
      var a=i*(Math.PI*2/firstHop.length)-Math.PI/2;
      n.x=CX+150*Math.cos(a);n.y=CY+120*Math.sin(a);n.vx=0;n.vy=0;n.fixed=false;
    });
    var kids=GNODES.filter(function(n){return n.type==='kid';});
    kids.forEach(function(k){
      var parent=NODE_BY_ID[k.parent];
      var pIdx=firstHop.indexOf(parent);
      var sibs=kids.filter(function(x){return x.parent===k.parent;});
      var kIdx=sibs.indexOf(k);
      var base=pIdx*(Math.PI*2/firstHop.length)-Math.PI/2;
      var off=(kIdx-(sibs.length-1)/2)*0.35;
      k.x=CX+260*Math.cos(base+off);k.y=CY+215*Math.sin(base+off);
      k.vx=0;k.vy=0;k.fixed=false;
    });
  }
  function seedCompressed(){
    var you=NODE_BY_ID['you'];
    you.x=CX;you.y=CY;you.vx=0;you.vy=0;you.fixed=true;
    var firstHop=GNODES.filter(function(n){return n.type==='first';});
    firstHop.forEach(function(n,i){
      var a=i*(Math.PI*2/firstHop.length)-Math.PI/2;
      n.x=CX+30*Math.cos(a);n.y=CY+24*Math.sin(a);n.vx=0;n.vy=0;n.fixed=false;
    });
    var kids=GNODES.filter(function(n){return n.type==='kid';});
    kids.forEach(function(k){
      var parent=NODE_BY_ID[k.parent];
      var pIdx=firstHop.indexOf(parent);
      var sibs=kids.filter(function(x){return x.parent===k.parent;});
      var kIdx=sibs.indexOf(k);
      var base=pIdx*(Math.PI*2/firstHop.length)-Math.PI/2;
      var off=(kIdx-(sibs.length-1)/2)*0.35;
      k.x=CX+58*Math.cos(base+off);k.y=CY+47*Math.sin(base+off);
      k.vx=0;k.vy=0;k.fixed=false;
    });
  }

  function stepNodes(damping){
    for(var i=0;i<GNODES.length;i++){
      var a=GNODES[i];
      for(var j=i+1;j<GNODES.length;j++){
        var b=GNODES[j];
        var dx=b.x-a.x,dy=b.y-a.y;
        var dsq=dx*dx+dy*dy;if(dsq<1)dsq=1;
        var d=Math.sqrt(dsq),f=REPULSE/dsq;
        var fx=f*dx/d,fy=f*dy/d;
        if(!a.fixed){a.vx-=fx;a.vy-=fy;}
        if(!b.fixed){b.vx+=fx;b.vy+=fy;}
      }
    }
    for(var ii=0;ii<GEDGES.length;ii++){
      var e=GEDGES[ii],A=e.a,B=e.b;
      var dx=B.x-A.x,dy=B.y-A.y;
      var d=Math.sqrt(dx*dx+dy*dy)||1;
      var f=(d-(IDEAL[e.k]||160))*(e.w*0.055);
      var fx=f*dx/d,fy=f*dy/d;
      if(!A.fixed){A.vx+=fx;A.vy+=fy;}
      if(!B.fixed){B.vx-=fx;B.vy-=fy;}
    }
    for(var m=0;m<GNODES.length;m++){
      var n=GNODES[m];
      if(n.fixed)continue;
      n.vx+=(CX-n.x)*CENTER_GX;
      n.vy+=(CY-n.y)*CENTER_GY;
      n.vx*=damping;n.vy*=damping;
      n.x+=n.vx;n.y+=n.vy;
      /* zero velocity at the clamp: real data can park nodes on the walls with
         residual velocity, so nodeEnergy() never crosses the unfold threshold and
         labels never fade in (found in the Phase-1 preview harness; same fix). */
      if(n.x<60){n.x=60;n.vx=0;}else if(n.x>840){n.x=840;n.vx=0;}
      if(n.y<50){n.y=50;n.vy=0;}else if(n.y>590){n.y=590;n.vy=0;}
    }
  }
  function nodeEnergy(){
    var e=0;
    for(var i=0;i<GNODES.length;i++){var n=GNODES[i];e+=n.vx*n.vx+n.vy*n.vy;}
    return e;
  }

  /* ══ label physics ══ */
  function initLabels(){
    GNODES.forEach(function(n){
      if(n.type==='you'){n.lx=n.x;n.ly=n.y;n.lvx=0;n.lvy=0;return;}
      var dx=n.x-CX,dy=n.y-CY;
      var d=Math.sqrt(dx*dx+dy*dy)||1;
      var push=n.type==='first'?52:32;
      n.lx=n.x+(dx/d)*push;n.ly=n.y+(dy/d)*push;n.lvx=0;n.lvy=0;
      n.lAvgX=undefined;n.lAvgY=undefined;n.lStable=0;n.lLocked=false;n.lAge=0;
    });
  }
  function stepLabels(activeList){
    var PAD=5,CLEARANCE=16,ANCHOR=0.09;
    for(var i=0;i<activeList.length;i++){
      var n=activeList[i];
      if(n.type==='you'){n.lIdealX=n.x;n.lIdealY=n.y;continue;}
      var dx=n.x-CX,dy=n.y-CY;
      var d=Math.sqrt(dx*dx+dy*dy)||1;
      var push=n.type==='first'?52:32;
      n.lIdealX=n.x+(dx/d)*push;n.lIdealY=n.y+(dy/d)*push;
    }
    for(var i2=0;i2<activeList.length;i2++){
      var a=activeList[i2];if(a.type==='you')continue;
      var halfWa=a.lblW/2+PAD,halfHa=a.lblH/2+PAD;
      for(var j=i2+1;j<activeList.length;j++){
        var b=activeList[j];if(b.type==='you')continue;
        var halfWb=b.lblW/2+PAD,halfHb=b.lblH/2+PAD;
        var dx=b.lx-a.lx,dy=b.ly-a.ly;
        var ox=(halfWa+halfWb)-Math.abs(dx);
        var oy=(halfHa+halfHb)-Math.abs(dy);
        if(ox>0&&oy>0){
          if(ox<oy){var p1=ox*0.55*(dx>=0?1:-1);a.lvx-=p1*0.5;b.lvx+=p1*0.5;}
          else{var p2=oy*0.55*(dy>=0?1:-1);a.lvy-=p2*0.5;b.lvy+=p2*0.5;}
        }
      }
    }
    for(var i3=0;i3<activeList.length;i3++){
      var n=activeList[i3];if(n.type==='you')continue;
      n.lvx+=(n.lIdealX-n.lx)*ANCHOR;
      n.lvy+=(n.lIdealY-n.ly)*ANCHOR;
      var halfWL=n.lblW/2,halfHL=n.lblH/2;
      for(var jj=0;jj<GNODES.length;jj++){
        var o=GNODES[jj];
        if(o===n)continue; /* own dot: the radial anchor owns that relationship */
        if(o.type==='you'){
          var hwY=PILL_W/2+8,hhY=PILL_H/2+8;
          var dxY=n.lx-o.x,dyY=n.ly-o.y;
          var aDx=Math.abs(dxY),aDy=Math.abs(dyY);
          if(aDx<hwY&&aDy<hhY){
            var oxY=hwY-aDx,oyY=hhY-aDy;
            if(oxY<oyY)n.lvx+=oxY*(dxY>=0?1:-1)*0.55;
            else n.lvy+=oyY*(dyY>=0?1:-1)*0.55;
          }
          continue;
        }
        /* box-aware: the label is a wide rectangle, not a point — a dot must clear
           the box EDGE by the cushion, or text sits on top of secondary dots */
        var hwN=halfWL+nodeRadius(o)+12,hhN=halfHL+nodeRadius(o)+12;
        var dx2=n.lx-o.x,dy2=n.ly-o.y;
        var adx2=Math.abs(dx2),ady2=Math.abs(dy2);
        if(adx2<hwN&&ady2<hhN){
          var oxN=hwN-adx2,oyN=hhN-ady2;
          if(oxN<oyN)n.lvx+=oxN*(dx2>=0?1:-1)*0.5;
          else n.lvy+=oyN*(dy2>=0?1:-1)*0.5;
        }
      }
      for(var jk=0;jk<GEDGES.length;jk++){
        var ee=GEDGES[jk];
        var x1=ee.a.x,y1=ee.a.y,x2=ee.b.x,y2=ee.b.y;
        var ex=x2-x1,ey=y2-y1;
        var lenSq=ex*ex+ey*ey;
        var t=lenSq>0.0001?((n.lx-x1)*ex+(n.ly-y1)*ey)/lenSq:0;
        if(t<0)t=0;else if(t>1)t=1;
        var cx=x1+t*ex,cy=y1+t*ey;
        var qx=cx,qy=cy;
        var bxMin=n.lx-halfWL,bxMax=n.lx+halfWL;
        var byMin=n.ly-halfHL,byMax=n.ly+halfHL;
        if(qx<bxMin)qx=bxMin;else if(qx>bxMax)qx=bxMax;
        if(qy<byMin)qy=byMin;else if(qy>byMax)qy=byMax;
        var gx=qx-cx,gy=qy-cy;
        var gap=Math.sqrt(gx*gx+gy*gy);
        if(gap<CLEARANCE){
          var dx3=n.lx-cx,dy3=n.ly-cy;
          var d3=Math.sqrt(dx3*dx3+dy3*dy3);
          if(d3<0.01){dx3=0;dy3=-1;d3=1;}
          var pushE=(CLEARANCE-gap)*0.55;
          n.lvx+=(dx3/d3)*pushE;n.lvy+=(dy3/d3)*pushE;
        }
      }
    }
    for(var i4=0;i4<activeList.length;i4++){
      var n=activeList[i4];if(n.type==='you')continue;
      /* lock-on-snap: once settled, a label freezes until its own node moves.
         Conflicting forces above the dead-zone otherwise sustain a visible
         limit-cycle vibration after drags. Frozen slightly-imperfect beats vibrating. */
      if(n.lLocked){
        if(Math.abs(n.x-n.lLockX)>1.2||Math.abs(n.y-n.lLockY)>1.2){n.lLocked=false;n.lStable=0;n.lAge=0;}
        else{n.lvx=0;n.lvy=0;continue;}
      }
      /* convergence guarantee: a label pinched between conflicting forces can
         limit-cycle just above the stability thresholds and vibrate forever.
         After ~1.5s of solving it takes its rolling average and freezes —
         no label oscillates indefinitely, by construction. */
      n.lAge=(n.lAge||0)+1;
      if(n.lAge>270&&n.lAvgX!==undefined){
        n.lx=n.lAvgX;n.ly=n.lAvgY;n.lvx=0;n.lvy=0;
        n.lLocked=true;n.lLockX=n.x;n.lLockY=n.y;
        continue;
      }
      /* stage walls repel labels before integration (soft), then clamp (hard):
         the frame is fixed — nothing may cross it, ever */
      var wPad=8,hwW=n.lblW/2,hhW=n.lblH/2;
      if(n.lx-hwW<wPad)n.lvx+=(wPad-(n.lx-hwW))*0.3;
      else if(n.lx+hwW>900-wPad)n.lvx-=((n.lx+hwW)-(900-wPad))*0.3;
      if(n.ly-hhW<wPad)n.lvy+=(wPad-(n.ly-hhW))*0.3;
      else if(n.ly+hhW>640-wPad)n.lvy-=((n.ly+hhW)-(640-wPad))*0.3;
      n.lvx*=0.62;n.lvy*=0.62;
      if(n.lvx>-0.04&&n.lvx<0.04)n.lvx=0;
      if(n.lvy>-0.04&&n.lvy<0.04)n.lvy=0;
      n.lx+=n.lvx;n.ly+=n.lvy;
      if(n.lx-hwW<wPad){n.lx=wPad+hwW;n.lvx=0;}
      else if(n.lx+hwW>900-wPad){n.lx=900-wPad-hwW;n.lvx=0;}
      if(n.ly-hhW<wPad){n.ly=wPad+hhW;n.lvy=0;}
      else if(n.ly+hhW>640-wPad){n.ly=640-wPad-hhW;n.lvy=0;}
      if(n.lAvgX===undefined){n.lAvgX=n.lx;n.lAvgY=n.ly;n.lStable=0;}
      else{n.lAvgX=n.lAvgX*0.85+n.lx*0.15;n.lAvgY=n.lAvgY*0.85+n.ly*0.15;}
      var ddx=n.lx-n.lAvgX,ddy=n.ly-n.lAvgY;
      var devSq=ddx*ddx+ddy*ddy;
      var velSq=n.lvx*n.lvx+n.lvy*n.lvy;
      if(devSq<0.6&&velSq<0.4){
        n.lStable++;
        if(n.lStable>6){n.lx=n.lAvgX;n.ly=n.lAvgY;n.lvx=0;n.lvy=0;n.lLocked=true;n.lLockX=n.x;n.lLockY=n.y;}
      }else n.lStable=0;
    }
  }

  /* ══ auto-fit viewBox to settled content ══ */
  function fitViewBox(){
    GNODES.forEach(function(n){
      if(n.type==='you')return;
      if(!shouldLabel(n)||n.lx===undefined||isNaN(n.lx)){
        var rdx=n.x-CX,rdy=n.y-CY;
        var rd=Math.sqrt(rdx*rdx+rdy*rdy)||1;
        var rpush=n.type==='first'?52:32;
        n.lx=n.x+(rdx/rd)*rpush;n.ly=n.y+(rdy/rd)*rpush;n.lvx=0;n.lvy=0;n.lLocked=false;n.lStable=0;n.lAge=0;n.lAvgX=undefined;
      }
    });
    var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
    GNODES.forEach(function(n){
      var r=n.type==='you'?0:nodeRadius(n);
      var nx1=n.type==='you'?n.x-PILL_W/2:n.x-r, nx2=n.type==='you'?n.x+PILL_W/2:n.x+r;
      var ny1=n.type==='you'?n.y-PILL_H/2:n.y-r, ny2=n.type==='you'?n.y+PILL_H/2:n.y+r;
      if(nx1<minX)minX=nx1;if(nx2>maxX)maxX=nx2;
      if(ny1<minY)minY=ny1;if(ny2>maxY)maxY=ny2;
      /* include the label box (all labels, so hover states stay inside) */
      if(n.type!=='you'){
        var lx1=n.lx-n.lblW/2,lx2=n.lx+n.lblW/2;
        var ly1=n.ly-n.lblH/2,ly2=n.ly+n.lblH/2;
        if(lx1<minX)minX=lx1;if(lx2>maxX)maxX=lx2;
        if(ly1<minY)minY=ly1;if(ly2>maxY)maxY=ly2;
      }
    });
    var PADV=22;
    SVG.setAttribute('viewBox',
      (minX-PADV)+' '+(minY-PADV)+' '+((maxX-minX)+PADV*2)+' '+((maxY-minY)+PADV*2));
  }

  function nodeSlug(n){ if(!n)return null; return n.type==='first'?n.id:(n.slug||null); }
  function canHop(n){ var sl=nodeSlug(n); return !!(sl&&HOOKS.canRecenter&&HOOKS.canRecenter(sl)); }
  function doHop(n){ var sl=nodeSlug(n); if(!sl||!canHop(n))return; hideHopTag(); if(HOOKS.onRecenter)HOOKS.onRecenter(sl, NODE_BY_ID[n.id]?NODE_BY_ID[n.id].label:sl); }
  window.__hopJump=function(i){ if(HOOKS.onTrailJump)HOOKS.onTrailJump(i); };
  window.__hop=function(sl,title){ if(HOOKS.canRecenter&&!HOOKS.canRecenter(sl))return; hideHopTag(); if(HOOKS.onRecenter)HOOKS.onRecenter(sl,title); };
  /* ══ state machine ══ */
  var hoveredLayer=null,clickedNode=null,dragging=null,unfolding=false,needsRefit=false;

  function focusMode(){
    if(clickedNode)return{mode:'click',id:clickedNode};
    if(hoveredLayer)return{mode:'layer',layer:hoveredLayer};
    return{mode:'default'};
  }
  function shouldLabel(n){
    var f=focusMode();
    if(f.mode==='default')return n.type==='first';
    if(f.mode==='layer'){
      if(f.layer==='first')return n.type==='first';
      return n.type==='first'||n.type==='kid';
    }
    if(n.id===f.id)return true;
    return !!NBRS[f.id][n.id];
  }
  function nodeOpacity(n){
    if(n.type==='you')return 1;
    var f=focusMode();
    if(f.mode==='default')return 1;
    if(f.mode==='layer'){
      if(f.layer==='first')return n.type==='first'?1:0.05;
      return n.type==='kid'?1:0.35;
    }
    if(n.id===f.id)return 1;
    if(NBRS[f.id][n.id])return 1;
    return 0;
  }
  function edgeOpacity(e){
    var f=focusMode();
    if(f.mode==='default')return 0.15;
    if(f.mode==='layer'){
      if(f.layer==='first')return(e.k==='primary'||e.k==='cross')?0.8:0.05;
      return(e.k==='kid'||e.k==='bridge')?0.8:0.05;
    }
    var cid=f.id,nbrs=NBRS[cid];
    var inSet=function(id){return id===cid||id==='you'||!!nbrs[id];};
    if(!inSet(e.from)||!inSet(e.to))return 0;
    if(e.from===cid||e.to===cid)return 0.88;
    return 0.55;
  }
  function nodeScale(n){
    var f=focusMode();
    if(f.mode==='layer'){
      if(f.layer==='first'&&n.type==='first')return 1.2;
      if(f.layer==='kid'&&n.type==='kid')return 1.3;
    }
    if(f.mode==='click'){
      if(n.id===f.id)return 1.35;
      if(NBRS[f.id][n.id])return 1.15;
    }
    if(dragging&&dragging.id===n.id)return 1.25;
    return 1;
  }
  function activeLabelList(){
    var list=[NODE_BY_ID['you']];
    for(var i=0;i<GNODES.length;i++){
      var n=GNODES[i];
      if(n.type!=='you'&&shouldLabel(n))list.push(n);
    }
    return list;
  }

  /* ══ persistent DOM ══ */
  var el={edges:{},firstNodes:{},kidNodes:{},labels:{},labelLeaders:{},labelTexts:{},pill:null,labelsLayer:null};
  function svgEl(tag,attrs){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);return e;}

  function buildDOM(){
    SVG.innerHTML='';
    var edgesG=svgEl('g',{});
    GEDGES.forEach(function(e,i){
      /* COLOR goes through CSS vars (inline style beats the attribute) so the
         V2 landing themes the graph without touching build or physics; the
         fallback hex is the original tuned palette, byte-identical anywhere
         the vars are absent. State logic only ever writes opacities. */
      var stroke,sw,dash=null;
      if(e.k==='primary'){stroke='var(--g-primary, #002FA6)';sw=0.6+e.w*0.8;}
      else if(e.k==='kid'){stroke='var(--g-kid, #4b60c9)';sw=0.4+e.w*0.5;}
      else if(e.k==='cross'){stroke='var(--g-cross, #b8b0a0)';sw=0.35+e.w*0.4;}
      else{stroke='var(--g-primary, #002FA6)';sw=0.3+e.w*0.4;dash='2 3';}
      var attrs={'class':'edge',x1:e.a.x,y1:e.a.y,x2:e.b.x,y2:e.b.y,
        'stroke-width':sw,'stroke-opacity':0.15,'stroke-linecap':'round','pointer-events':'none'};
      if(dash)attrs['stroke-dasharray']=dash;
      var line=svgEl('line',attrs);
      line.style.stroke=stroke;
      edgesG.appendChild(line);el.edges[i]=line;
    });
    SVG.appendChild(edgesG);

    var nodesG=svgEl('g',{});
    GNODES.forEach(function(n){
      if(n.type!=='first')return;
      var c=svgEl('circle',{'class':'node node-first','data-id':n.id,'data-type':'first',
        'data-grabbable':'',cx:n.x,cy:n.y,r:nodeRadius(n),opacity:1});
      c.style.fill='var(--g-primary, #002FA6)';
      nodesG.appendChild(c);el.firstNodes[n.id]=c;
    });
    GNODES.forEach(function(n){
      if(n.type!=='kid')return;
      var c=svgEl('circle',{'class':'node node-kid','data-id':n.id,'data-type':'kid',
        'data-grabbable':'',cx:n.x,cy:n.y,r:2.8,opacity:1});
      c.style.fill='var(--g-ink, #15151a)';
      nodesG.appendChild(c);el.kidNodes[n.id]=c;
    });
    var you=NODE_BY_ID['you'];
    var youG=svgEl('g',{'class':'you-mark','data-id':'you'});
    /* Paper-colored knockout so edges terminating at center don't
       visually pass through the wordmark. Type is the mark. */
    var knock=svgEl('rect',{x:you.x-52,y:you.y-11,width:104,height:22,
      stroke:'none','pointer-events':'none'});
    knock.style.fill='var(--g-halo, #faf9f5)';
    youG.appendChild(knock);
    var pt=svgEl('text',{x:you.x,y:you.y+5,'text-anchor':'middle','font-family':LABEL_FONT,
      'font-size':15,'letter-spacing':1.8,'font-weight':700,'pointer-events':'none'});
    pt.style.fill='var(--g-ink, #15151a)';
    pt.textContent=(you.label||'').toUpperCase();
    youG.appendChild(pt);
    nodesG.appendChild(youG);
    el.pill=youG;
    /* hop affordance: HTML overlay in the stage — constant SCREEN size (an SVG tag
       scales with the viewBox and shrinks on big graphs), ink plate + paper mono per
       tooltip contrast/legibility guidelines */
    var stageEl=document.getElementById('stage');
    if(stageEl&&!document.getElementById('hopTip')){
      var tip=document.createElement('div');
      tip.id='hopTip';tip.className='hop-tip';
      tip.textContent='Double-click to hop here';
      stageEl.appendChild(tip);
    }
    el.hopTag=document.getElementById('hopTip');
    SVG.appendChild(nodesG);

    var labelsG=svgEl('g',{id:'labelsLayer'});
    GNODES.forEach(function(n){
      if(n.type==='you')return;
      var g=svgEl('g',{'class':'label-grp','data-id':n.id,opacity:n.type==='first'?1:0,'pointer-events':'none'});
      var leader=svgEl('line',{'class':'leader','stroke-width':0.5,'stroke-opacity':0.75,x1:0,y1:0,x2:0,y2:0});
      leader.style.stroke='var(--g-cross, #b8b0a0)';
      g.appendChild(leader);
      if(n.type==='first'){
        var name=svgEl('text',{'text-anchor':'middle','font-family':LABEL_FONT,'font-weight':TYPO?600:500,'font-size':n.fs||12.5,x:0,y:0});
        name.style.fill='var(--g-ink, #15151a)';
        name.textContent=n.label;g.appendChild(name);
        var match=svgEl('text',{'text-anchor':'middle','font-family':'Chivo Mono, monospace','font-size':TYPO?(n.fs*0.5):9.5,'letter-spacing':1,x:0,y:0});
        match.style.fill='var(--g-ink3, #8a8a93)';
        match.textContent=n.match+'% MATCH';g.appendChild(match);
        el.labelTexts[n.id]={name:name,match:match};
      }else{
        var name2=svgEl('text',{'text-anchor':'middle','font-family':LABEL_FONT,'font-weight':TYPO?500:400,'font-size':n.fs||10.5,x:0,y:0});
        name2.style.fill='var(--g-ink2, #56565e)';
        name2.textContent=n.label;g.appendChild(name2);
        el.labelTexts[n.id]={name:name2};
      }
      labelsG.appendChild(g);
      el.labels[n.id]=g;el.labelLeaders[n.id]=leader;
    });
    SVG.appendChild(labelsG);
    el.labelsLayer=labelsG;
  }

  function updateEdgeVisuals(){for(var i=0;i<GEDGES.length;i++){el.edges[i].setAttribute('stroke-opacity',edgeOpacity(GEDGES[i]));}}
  function updateEdgeGeometry(){
    for(var i=0;i<GEDGES.length;i++){
      var e=GEDGES[i],line=el.edges[i];
      line.setAttribute('x1',e.a.x);line.setAttribute('y1',e.a.y);
      line.setAttribute('x2',e.b.x);line.setAttribute('y2',e.b.y);
    }
  }
  function updateNodeVisuals(){
    GNODES.forEach(function(n){
      if(n.type==='you')return;
      var c=n.type==='first'?el.firstNodes[n.id]:el.kidNodes[n.id];
      if(!c)return;
      var baseR=n.type==='first'?nodeRadius(n):(shouldLabel(n)?3.8:2.8);
      c.setAttribute('r',baseR*nodeScale(n));
      c.setAttribute('opacity',nodeOpacity(n));
    });
  }
  function updateNodeGeometry(){
    GNODES.forEach(function(n){
      if(n.type==='you')return;
      var c=n.type==='first'?el.firstNodes[n.id]:el.kidNodes[n.id];
      if(!c)return;
      c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);
    });
  }
  function updateLabels(){
    GNODES.forEach(function(n){
      if(n.type==='you')return;
      var g=el.labels[n.id];if(!g)return;
      var show=shouldLabel(n);
      var op=show?Math.max(0,nodeOpacity(n)):0;
      g.setAttribute('opacity',op);
      if(op<=0.001)return;
      var nR=nodeRadius(n);
      var dxL=n.lx-n.x,dyL=n.ly-n.y;
      var dL=Math.sqrt(dxL*dxL+dyL*dyL)||1;
      var startX=n.x+(dxL/dL)*(nR+1),startY=n.y+(dyL/dL)*(nR+1);
      var halfW=n.lblW/2,halfH=n.lblH/2;
      var tt=Math.min((halfW+3)/Math.abs(dxL||0.1),(halfH+3)/Math.abs(dyL||0.1));
      var endX=n.lx-dxL*tt,endY=n.ly-dyL*tt;
      var leader=el.labelLeaders[n.id];
      leader.setAttribute('x1',startX);leader.setAttribute('y1',startY);
      leader.setAttribute('x2',endX);leader.setAttribute('y2',endY);
      var texts=el.labelTexts[n.id];
      if(n.type==='first'){
        var fs1=n.fs||12.5;
        texts.name.setAttribute('x',n.lx);texts.name.setAttribute('y',n.ly-(TYPO?fs1*0.24:3));
        texts.match.setAttribute('x',n.lx);texts.match.setAttribute('y',n.ly+(TYPO?fs1*0.88:11));
      }else{
        texts.name.setAttribute('x',n.lx);texts.name.setAttribute('y',n.ly+(TYPO?(n.fs||10.5)*0.33:3.5));
      }
    });
  }

  /* ══ animation loop ══ */
  var rafId=null,activityUntil=0;
  function ensureLoop(minMs){
    var now=performance.now();
    if(minMs)activityUntil=Math.max(activityUntil,now+minMs);
    if(!rafId)rafId=requestAnimationFrame(tick);
  }
  function tick(){
    var now=performance.now();
    var act=activeLabelList();
    if(unfolding){
      for(var u=0;u<3;u++)stepNodes(0.88);
      updateEdgeGeometry();updateNodeGeometry();
      /* keep the pill centered rect in sync (fixed, but harmless) */
      if(nodeEnergy()<0.5){
        unfolding=false;
        initLabels();
        var act2=activeLabelList();
        for(var s=0;s<260;s++)stepLabels(act2);
        updateLabels();
        el.labelsLayer.classList.remove('hidden');
      }
      rafId=requestAnimationFrame(tick);
      return;
    }
    if(dragging){for(var i=0;i<4;i++)stepNodes(0.82);}
    for(var j=0;j<3;j++)stepLabels(act);
    if(dragging){updateEdgeGeometry();updateNodeGeometry();}
    updateLabels();
    var energy=0;
    for(var k=0;k<act.length;k++){energy+=act[k].lvx*act[k].lvx+act[k].lvy*act[k].lvy;}
    if(dragging||energy>0.05||now<activityUntil){
      rafId=requestAnimationFrame(tick);
    }else{
      for(var m=0;m<act.length;m++){var mn=act[m];if(mn.type==='you')continue;mn.lvx=0;mn.lvy=0;}
      rafId=null;

    }
  }
  function commitStateChange(){
    updateEdgeVisuals();
    updateNodeVisuals();
    for(var i=0;i<GNODES.length;i++){
      /* reset averages so NEWLY-ACTIVATED labels settle fresh — but do NOT unlock
         already-settled ones: unlocking on every hover re-solves the whole field and
         labels visibly slide away from the cursor. Locked labels stay planted and act
         as repellers; newcomers solve around them. Unlock happens only when a node
         actually moves (drag/unfold). */
      GNODES[i].lAvgX=undefined;GNODES[i].lAvgY=undefined;GNODES[i].lStable=0;GNODES[i].lAge=0;
    }
    ensureLoop(500);
  }

  /* ══ unfold: the search "generates" the graph ══ */
  function runUnfold(){
    hoveredLayer=null;clickedNode=null;
    closePanel();
    updateTrail(null);
    highlightRail(null);
    el.labelsLayer.classList.add('hidden');
    seedCompressed();
    updateEdgeGeometry();updateNodeGeometry();
    updateEdgeVisuals();updateNodeVisuals();
    unfolding=true;
    ensureLoop(3000);
  }

  /* ══ detail / trail / rail ══ */
  var railEl=document.querySelector('.rail');
  function openPanel(){railEl.classList.add('dmode');}
  function closePanel(){railEl.classList.remove('dmode');}
  document.getElementById('railBack').addEventListener('click',function(){
    clickedNode=null;commitStateChange();closePanel();updateTrail(null);highlightRail(null);
  });

  function pills(a,c){return a.map(function(x){var slug=skillSlugs[(''+x).toLowerCase()];return slug?('<a class="tag '+c+'" href="/glossary#skill-'+slug+'">'+x+'</a>'):('<span class="tag '+c+'">'+x+'</span>');}).join('');}
  /* "Opens paths to" lists ROLES, not skills, so pills() rendered them as inert
     spans — the one place in the detail panel naming a destination you could not
     go to.

     Two destinations, picked by whether the board can actually answer:
       - open roles on the board -> a real <a> to /jobs/<slug>, so the chip
         resolves the question it raises ("what does a Technical Artist do all
         day?") with live listings, and middle-click / open-in-new-tab work.
       - none -> fall back to selecting that node, exactly as its rail item does,
         which is still useful and never a dead end.
     The count gate is the same boardCounts the panel's jobs CTA uses. Linking
     ungated would ship a link to an empty board, which is the mistake this
     codebase has now made three times. */
  function rolePills(list){return list.map(function(x){
    var sl=x.slug;
    if(!sl)return '<span class="tag">'+x.t+'</span>';
    var n=(boardCounts&&boardCounts[sl])||0;
    if(n>0)return '<a class="tag tag-go" href="/jobs/'+sl+'">'+x.t+'</a>';
    if(!NODE_BY_ID[sl])return '<span class="tag">'+x.t+'</span>';
    return '<button type="button" class="tag tag-go" data-goto="'+sl+'">'+x.t+'</button>';
  }).join('');}

  function detailSignals(o){
    var rows='';
    function row(k,v){ if(v==null)return; v=Math.max(0,Math.min(100,Math.round(v)));
      rows+='<div class="d-sig-row"><span class="k">'+k+'</span><span class="t"><span class="f" style="width:'+v+'%"></span></span><span class="v">'+v+'</span></div>'; }
    row('Skill readiness',o.match);
    row('Shared abilities',o.capability);
    row('Commonly done',o.mobility);
    var src=(o.mobility==null)?'':(o.mobility_source==='observed-flow-us')?'observed US worker flow':(o.mobility_source==='observed-flow-ctot')?'observed US worker flow (DOL CPS/SIPP)':(o.mobility_source==='observed-flow-eu')?'observed EU worker flow':(o.mobility_source==='related')?'O*NET related occupations':'';
    if(src)rows+='<div class="d-sig-src">'+src+'</div>';
    if(!rows)return '';
    return '<div class="dsk"><div class="cap">Why this fit</div><div class="d-sig">'+rows+'</div></div>';
  }
  function hopButton(slug,title){
    var can=HOOKS.canRecenter?HOOKS.canRecenter(slug):false;
    if(can)return '<button class="d-hop" onclick="window.__hop(\''+slug+'\',\''+String(title).replace(/'/g,'')+'\')"><span>Hop here</span></button>';
    return '<button class="d-hop off" disabled><span>Hop here</span><span class="nd">Not enough data yet</span></button>';
  }
  function licenseStrip(o){
    if(!o.license)return '';
    var head=(o.license.req==='required')?'Licensed profession':'License for some roles';
    /* The badge answers "what does this take?" — /licenses answers it fully. */
    return '<a class="d-lic" data-license="'+o.id+'" href="/licenses#occ-'+o.id+'"><span class="k">'+head+'</span><span class="t">'+o.license.label+'</span></a>';
  }
  function kindTag(o){
    if(!o.kind)return '';
    var txt=(o.kind==='lateral')?'Lateral':('Pivot → '+(o.cluster||''));
    return '<span class="lbl">'+txt+'</span>';
  }
  function setExportCTA(){var re=document.getElementById('railExport');if(re)re.innerHTML='<div class="d-export" onclick="openExport()"><div class="in"><span class="tx"><span class="a">Export this route</span><span class="b">Free PDF &middot; no account</span></span><svg viewBox="0 0 24 24"><use href="#i-export45"/></svg></div></div>';}
  // The destination's live board, from the currently-selected role/kid. Gated on
  // a real count (>0), so a route with no open roles shows nothing rather than a
  // dead 404. Re-paints when jobs-index arrives, in case a detail rendered first.
  function paintJobsCTA(){
    var slot=document.getElementById('djobs'); if(!slot)return;
    var slug=(xsel&&xsel.kind==='kid'&&xsel.kid)?xsel.kid.slug:(xsel&&xsel.kind==='role'&&xsel.role)?xsel.role.id:null;
    var title=(xsel&&xsel.kind==='kid'&&xsel.kid)?xsel.kid.t:(xsel&&xsel.kind==='role'&&xsel.role)?xsel.role.title:'';
    var n=(slug&&boardCounts&&boardCounts[slug])||0;
    if(!n){slot.innerHTML='';return;}
    slot.innerHTML='<a class="d-jobs" href="/jobs/'+slug+'"><span class="tx">'+n.toLocaleString()+' open '+title.toLowerCase()+' role'+(n===1?'':'s')+'</span><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg></a>';
  }
  function renderRoleDetail(rl){
    xsel={kind:'role',role:rl};
    setExportCTA();
    var d=document.getElementById('detail');if(!d)return;
    d.innerHTML=
      '<div class="d-cap"><span class="d-sector">'+rl.field+'</span>'+kindTag(rl)+'</div>'+
      '<div class="d-title">'+rl.title+'</div>'+
      '<div class="d-match"><span class="n">'+rl.match+'</span><span class="u">% match from '+(DATA.personalized?'your skills':DATA.originLabel.toLowerCase())+'</span></div>'+
      hopButton(rl.id,rl.title)+
      detailSignals(rl)+licenseStrip(rl)+
      '<div class="drow"><span class="k">Avg salary</span><span class="v">'+rl.salary+'</span></div>'+
      '<div class="drow"><span class="k">Job demand</span><span class="v">'+rl.demand+'</span></div>'+
      '<div class="drow"><span class="k">Remote</span><span class="v">'+rl.remote+'</span></div>'+
      '<div class="drow"><span class="k">Transition</span><span class="v">'+rl.time+'</span></div>'+
      '<div class="d-jobs-slot" id="djobs"></div>'+
      '<div class="dsk"><div class="cap">Skills you have</div><div class="tags">'+pills(rl.have,"have")+'</div></div>'+
      '<div class="dsk"><div class="cap">Skills to build</div><div class="tags">'+pills(rl.learn,"")+'</div></div>'+
      (rl.next.length?'<div class="dsk"><div class="cap">Opens paths to</div><div class="tags">'+rolePills(rl.next)+'</div></div>':'');
    var host=document.getElementById('detail');
    if(host)host.querySelectorAll('.tag-go').forEach(function(b){
      b.addEventListener('click',function(){
        var rid=b.getAttribute('data-goto');
        clickedNode=rid;commitStateChange();updateDetailForId(rid);
      });
    });
    paintJobsCTA();
  }
  function kidStory(kid,parent){
    var out='Your skills cover '+kid.m+'% of what '+kid.t+' postings ask for today.';
    if(kid.gap&&kid.gap.length)out+=' Missing: '+kid.gap.slice(0,3).join(', ')+'.';
    if(kid.after!=null&&kid.after>kid.m)out+=' Route through '+parent.title+' first and readiness reads '+kid.after+'% \u2014 the bridge earns its detour.';
    else out+=' No bridge required \u2014 this one opens directly as the gap closes.';
    return out;
  }
  function renderKidDetail(kid,parent){
    xsel={kind:'kid',kid:kid,parent:parent};
    setExportCTA();
    var d=document.getElementById('detail');if(!d)return;
    d.innerHTML=
      '<div class="d-cap"><span class="d-sector">Second hop</span><span class="lbl">Via '+parent.title+'</span></div>'+
      '<div class="d-title">'+kid.t+'</div>'+
      '<div class="d-match"><span class="n">'+kid.m+'</span><span class="u">% match at second hop</span></div>'+
      hopButton(kid.slug||'',kid.t)+
      '<div class="drow"><span class="k">Path</span><span class="v">'+DATA.originLabel+' &rarr; '+parent.title+' &rarr; '+kid.t+'</span></div>'+
      '<div class="drow"><span class="k">Bridge role</span><span class="v">'+parent.title+'</span></div>'+
      '<div class="d-jobs-slot" id="djobs"></div>'+
      '<div class="dsk"><div class="cap">The gap, measured</div><p style="font-size:13.5px;color:var(--ink-2);line-height:1.55;margin-top:4px">'+kidStory(kid,parent)+'</p></div>';
    paintJobsCTA();
  }
  function updateTrail(id){
    var tc=document.getElementById('trailCrumbs');if(!tc)return;
    var hops=(HOOKS.getTrail?HOOKS.getTrail():null)||[{title:DATA.originLabel}];
    var crumbs=[];
    for(var hi=0;hi<hops.length-1;hi++){
      crumbs.push('<button class="crumb link" onclick="window.__hopJump('+hi+')">'+hops[hi].title+'</button>');
    }
    crumbs.push(DATA.originLabel);
    if(id&&id!=='you'){
      if(id.indexOf('_')>-1){
        var parts=id.split('_');
        var p=null;
        for(var i=0;i<ROLES.length;i++){if(ROLES[i].id===parts[0]){p=ROLES[i];break;}}
        var kid=NEXT[parts[0]][parseInt(parts[1])];
        if(p)crumbs.push(p.title);
        if(kid)crumbs.push(kid.t);
      }else{
        for(var j=0;j<ROLES.length;j++){if(ROLES[j].id===id){crumbs.push(ROLES[j].title);break;}}
      }
    }
    tc.innerHTML=crumbs.map(function(c,i){
      var last=i===crumbs.length-1;
      return '<span class="crumb'+(last?' on':'')+'">'+c+'</span>'+(last?'':'<span class="tsep">&rarr;</span>');
    }).join('');
  }
  function highlightRail(id){
    var pid=id?(id.indexOf('_')>-1?id.split('_')[0]:id):null;
    document.querySelectorAll('.rail-item').forEach(function(b){
      b.classList.toggle('on',b.getAttribute('data-id')===pid);
    });
  }
  function updateDetailForId(id){
    updateTrail(id);
    highlightRail(id);
    if(!id||id==='you'){closePanel();return;}
    if(id.indexOf('_')>-1){
      var parts=id.split('_');
      var p=null;
      for(var i=0;i<ROLES.length;i++){if(ROLES[i].id===parts[0]){p=ROLES[i];break;}}
      var kid=NEXT[parts[0]][parseInt(parts[1])];
      if(p&&kid)renderKidDetail(kid,p);
    }else{
      for(var j=0;j<ROLES.length;j++){if(ROLES[j].id===id){renderRoleDetail(ROLES[j]);break;}}
    }
    openPanel();
  }

  /* ══ interaction ══ */
  var dragMoved=false,dragStart=null;
  function svgPoint(ev){
    var pt=SVG.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;
    return pt.matrixTransform(SVG.getScreenCTM().inverse());
  }
  function hitTestNode(px,py){
    var best=null,bestD=Infinity;
    for(var i=0;i<GNODES.length;i++){
      var n=GNODES[i];if(n.type==='you')continue;
      var r=nodeRadius(n)*1.8+5;
      var dx=px-n.x,dy=py-n.y;
      var dsq=dx*dx+dy*dy;
      if(dsq<r*r&&dsq<bestD){best=n;bestD=dsq;}
    }
    return best;
  }

  /* Labels are clickable targets too, not just decoration. This reuses the
     CACHED lblW/lblH — set once from character counts per non-negotiable #1 —
     so nothing is measured here and the simulation loop is untouched. Circles
     are tested first and win: the dot is the precise target, the label is the
     generous one, and a label overlapping a neighbouring node must not steal it. */
  function hitTestLabel(px,py){
    for(var i=0;i<GNODES.length;i++){
      var n=GNODES[i];
      if(n.type==='you'||n.lblW==null||n.lx==null)continue;
      if(Math.abs(px-n.lx)<=n.lblW/2+2&&Math.abs(py-n.ly)<=n.lblH/2+2)return n;
    }
    return null;
  }
  function hitTestAny(px,py){return hitTestNode(px,py)||hitTestLabel(px,py);}

  var hopHoverNode=null,hopTagTimer=null;
  function showHopTag(n){
    if(!el.hopTag)return;
    var ctm=SVG.getScreenCTM();if(!ctm)return;
    /* Anchor on the label text, not the dot: the label is what the eye reads
       (and the generous hit target), so the cue belongs to it. Cached lx/ly/lblH
       only — nothing is measured here (non-negotiable #1). Dot is the fallback
       for the rare frame before a label has settled. */
    var pt=SVG.createSVGPoint();
    if(n.lx!=null&&n.lblH!=null){pt.x=n.lx;pt.y=n.ly-n.lblH/2-6;}
    else{pt.x=n.x;pt.y=n.y-nodeRadius(n)-4;}
    var sp=pt.matrixTransform(ctm);
    var sr=document.getElementById('stage').getBoundingClientRect();
    el.hopTag.style.left=(sp.x-sr.left)+'px';
    el.hopTag.style.top=(sp.y-sr.top)+'px';
    el.hopTag.classList.add('on');
  }
  function hideHopTag(){ if(el.hopTag)el.hopTag.classList.remove('on'); if(hopTagTimer){clearTimeout(hopTagTimer);hopTagTimer=null;} hopHoverNode=null; }
  SVG.addEventListener('mousemove',function(ev){
    if(unfolding)return;
    if(!dragging&&!clickedNode){
      var p=svgPoint(ev);
      var hit=hitTestAny(p.x,p.y);
      SVG.classList.toggle('over-label',!!hit&&!hitTestNode(p.x,p.y));
      var newLayer=hit?(hit.type==='first'?'first':'kid'):null;
      if(newLayer!==hoveredLayer){hoveredLayer=newLayer;commitStateChange();}
      if(hit!==hopHoverNode){
        hideHopTag();
        if(hit&&canHop(hit)){
          hopHoverNode=hit;
          hopTagTimer=setTimeout(function(){ if(hopHoverNode===hit)showHopTag(hit); },500);
        }
      }
    }
    if(dragging){
      if(dragStart){
        var dx=ev.clientX-dragStart.x,dy=ev.clientY-dragStart.y;
        if(dx*dx+dy*dy>25)dragMoved=true;
      }
      var p2=svgPoint(ev);
      dragging.x=p2.x;dragging.y=p2.y;
      dragging.vx=0;dragging.vy=0;
    }
  });
  SVG.addEventListener('mouseleave',function(){
    SVG.classList.remove('over-label');
    hideHopTag();
    if(!dragging&&!clickedNode&&hoveredLayer!==null){hoveredLayer=null;commitStateChange();}
  });
  SVG.addEventListener('dblclick',function(ev){
    if(unfolding||dragMoved)return;
    var p=svgPoint(ev);
    var hit=hitTestAny(p.x,p.y);
    if(hit)doHop(hit);
  });
  SVG.addEventListener('mousedown',function(ev){
    if(unfolding)return;
    var target=ev.target;
    if(target&&target.hasAttribute&&target.hasAttribute('data-grabbable')){
      ev.preventDefault();
      var id=target.getAttribute('data-id');
      var n=NODE_BY_ID[id];if(!n)return;
      dragging=n;dragMoved=false;
      dragStart={x:ev.clientX,y:ev.clientY};
      hoveredLayer=null;
      n.fixed=true;
      SVG.classList.add('dragging');
      ensureLoop();
      return;
    }
    var lp=svgPoint(ev);
    var lab=hitTestLabel(lp.x,lp.y);
    if(lab){
      /* Select, never drag: the label sits offset from its node, so using it as
         a drag handle would snap the node to the pointer on grab. */
      ev.preventDefault();
      clickedNode=(clickedNode===lab.id)?null:lab.id;
      commitStateChange();
      if(clickedNode)updateDetailForId(clickedNode);
      else{closePanel();updateTrail(null);highlightRail(null);}
      return;
    }
    if(clickedNode){
      clickedNode=null;
      commitStateChange();
      closePanel();
      updateTrail(null);
      highlightRail(null);
    }
  });
  window.addEventListener('mouseup',function(){
    if(!dragging)return;
    var dId=dragging.id;
    var wasClick=!dragMoved;
    dragging.fixed=false;
    dragging=null;dragStart=null;
    SVG.classList.remove('dragging');
    if(wasClick){
      clickedNode=(clickedNode===dId)?null:dId;
      commitStateChange();
      updateDetailForId(clickedNode);
    }else{
      ensureLoop(600);
    }
  });

  /* rail */
  var railPivotsOnly=false;
  function buildRail(){
    var box=document.getElementById('railList');if(!box)return;
    var fb=document.getElementById('railFilter');
    var hasKinds=ROLES.some(function(r){return r.kind;});
    if(fb){fb.style.display=hasKinds?'':'none';fb.classList.toggle('on',railPivotsOnly);fb.setAttribute('aria-pressed',railPivotsOnly?'true':'false');}
    /* Rank by fit when the payload carries it (observed mobility + abilities steer
       the order, docs/15 Thread 7); match stays the displayed number. Personalized
       recomputes lack fit and fall back to match order. */
    var sorted=ROLES.slice().sort(function(a,b){return ((b.fit!=null?b.fit:b.match)-(a.fit!=null?a.fit:a.match))||(b.match-a.match);});
    if(railPivotsOnly&&hasKinds)sorted=sorted.filter(function(r){return r.kind==='pivot';});
    box.innerHTML=(sorted.map(function(r){
      return '<button class="rail-item" data-id="'+r.id+'"><span>'+r.title+'</span><span class="pc">'+r.match+'%</span></button>';
    }).join(''))||'<div class="rail-empty">No cross-industry pivots in the top routes yet.</div>';
    box.querySelectorAll('.rail-item').forEach(function(b){
      b.addEventListener('click',function(){
        var rid=b.getAttribute('data-id');
        if(clickedNode===rid){
          clickedNode=null;commitStateChange();closePanel();updateTrail(null);highlightRail(null);
        }else{
          clickedNode=rid;commitStateChange();updateDetailForId(rid);
        }
      });
    });
  }

  document.getElementById('undoBtn').addEventListener('click',function(){
    clickedNode=null;hoveredLayer=null;
    commitStateChange();
    closePanel();
    updateTrail(null);
    highlightRail(null);
  });
  var goBtn=document.getElementById('goBtn');
  // "View N open roles" takes you to this occupation's board (or the global
  // board if it has none yet). The graph already computes live, so the button
  // is a destination, not a trigger.
  if(goBtn)goBtn.addEventListener('click',function(){
    var slug=DATA.originSlug,n=(slug&&boardCounts&&boardCounts[slug])||0;
    window.location.href=n>0?('/jobs/'+slug):'/jobs';
  });
  var cb=document.getElementById('capBtn');
  if(cb){cb.addEventListener('click',function(){cb.textContent='Sent \u2014 check your inbox';});}

  /* ══ init: silent settle from compressed seed → fit → unfold live ══ */
  seedCompressed();
  for(var s0=0;s0<520;s0++)stepNodes(0.88);
  initLabels();
  (function(){var act=activeLabelList();for(var s1=0;s1<260;s1++)stepLabels(act);})();
  buildDOM();
  buildRail();
  var railFilterBtn=document.getElementById('railFilter');
  if(railFilterBtn)railFilterBtn.addEventListener('click',function(){railPivotsOnly=!railPivotsOnly;buildRail();});
  hydrateStatic();
  updateTrail(null);
  /* replay the unfold so first paint animates from the pill */
  runUnfold();


  // ---- export sheet: live preview of the actual report + signals + capture ----
  // The preview is a real miniature of the report's first page, rendered
  // deterministically from the selected route's data (no placeholder art, no autoplay,
  // no blur-tease). Selection is tracked when a detail renders.
  var xsel=null; // {kind:'role', role} | {kind:'kid', kid, parent}

  function pct(v){return (v==null)?null:Math.max(0,Math.min(100,Math.round(v)));}
  function icoUR(){return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';}

  function buildPreviewPage(o){
    var bars='';
    (o.have||[]).slice(0,3).forEach(function(sk){
      bars+='<div class="m-bar"><span class="k">'+sk+'</span><span class="t"><span class="f" style="width:88%"></span></span><span class="v">yes</span></div>';
    });
    (o.learn||[]).slice(0,3).forEach(function(sk){
      bars+='<div class="m-bar"><span class="k">'+sk+'</span><span class="t"><span class="f" style="width:18%"></span></span><span class="v">gap</span></div>';
    });
    var plan='';
    var phases=[['WK 1—04',(o.learn&&o.learn[0])?('Foundations: '+o.learn[0]):'Foundations'],
                ['WK 5—08',(o.learn&&o.learn[1])?(o.learn[1]+' + first artifact'):'Build the evidence'],
                ['WK 9—12','Applications, positioned as proof']];
    phases.forEach(function(ph){plan+='<div class="m-ph"><div class="w">'+ph[0]+'</div><div class="s">'+ph[1]+'</div></div>';});
    return '<div class="xpage">'+
      '<div class="m-head"><span class="m-brand">PIVOTHOP</span><span class="m-tag">Route report</span></div>'+
      '<div class="m-route">'+DATA.originLabel+' '+icoUR()+' '+o.title+'</div>'+
      '<div class="m-meta">'+o.match+'% match · '+(o.salary||'—')+' · '+(o.demand||'')+' demand · '+(o.remote||'')+' remote</div>'+
      '<div class="m-cap">Skill readiness — read from live postings</div>'+bars+
      '<div class="m-cap">The 90-day plan</div><div class="m-plan">'+plan+'</div>'+
      '<div class="m-foot"><span>Page 1 of 6</span><span>'+(DATA.postings||'')+' postings read</span></div>'+
    '</div>';
  }

  function buildSignals(o){
    var rows='';
    function row(k,v){ if(v==null)return; rows+='<div class="xsig-row"><span class="k">'+k+'</span><span class="t"><span class="f" style="width:'+v+'%"></span></span><span class="v">'+v+'</span></div>'; }
    row('Skill readiness',pct(o.match));
    row('Shared core abilities',pct(o.capability));
    row('Commonly done',pct(o.mobility));
    var src='';
    if(o.mobility!=null){
      src=(o.mobility_source==='observed-flow-us')?'observed US worker flow':
          (o.mobility_source==='observed-flow-ctot')?'observed US worker flow (DOL CPS/SIPP)':
          (o.mobility_source==='observed-flow-eu')?'observed EU worker flow':
          (o.mobility_source==='related')?'O*NET related occupations':'';
    }
    if(src)rows+='<div class="xsig-src">'+src+'</div>';
    return rows||'<div class="xsig-src">Signals compute as data accumulates</div>';
  }

  function buildContents(hasBridge){
    var secs=[['02','The role, decoded'],['03','Your 90-day plan'],['04','Evidence checklist'],['05','Your graph, printed'],['06','Salary map']];
    if(hasBridge)secs.splice(2,0,['·','The bridge role']);
    return secs.map(function(x){return '<div class="xtoc"><span class="n">'+x[0]+'</span><span class="s">'+x[1]+'</span></div>';}).join('');
  }

  function openExport(){
    var o,hasBridge=false;
    if(xsel&&xsel.kind==='kid'){
      o={title:xsel.kid.t,match:xsel.kid.m,salary:xsel.parent.salary,demand:xsel.parent.demand,remote:xsel.parent.remote,
         have:xsel.parent.have,learn:xsel.parent.learn};
      hasBridge=true;
    }else if(xsel&&xsel.kind==='role'){o=xsel.role;}
    else{o=ROLES[0];}
    document.getElementById('xdoc').innerHTML=buildPreviewPage(o);
    var rt=document.getElementById('xroute');
    if(rt)rt.innerHTML=DATA.originLabel+' '+icoUR()+' '+o.title+' \u00b7 '+o.match+'% match'+(DATA.postings?(' \u00b7 '+DATA.postings.toLocaleString()+' postings read'):'');
    var tc=document.getElementById('xcontents');
    if(tc)tc.innerHTML='Inside: the role, decoded \u00b7 your 90-day plan'+(hasBridge?' \u00b7 the bridge role':'')+' \u00b7 evidence checklist \u00b7 your graph, printed \u00b7 salary map';
    document.getElementById('xmodal').classList.add('open');
    var em=document.getElementById('xemail');
    if(em)setTimeout(function(){em.focus();},120);
  }
  window.openExport=openExport;

  function closeX(){document.getElementById('xmodal').classList.remove('open');}
  document.getElementById('xclose').addEventListener('click',closeX);
  document.getElementById('xveil').addEventListener('click',closeX);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeX();});

  /* ══ skill sheet ══
     Detail-panel chips keep their /glossary#skill-<id> href (SEO, new-tab,
     no-JS), but a plain left-click opens a card over the graph instead of
     leaving the instrument. Definitions come from the same file the glossary
     renders, fetched once on first hover and cached. */
  var skGloss=null,skGlossP=null;
  function fetchSkillGloss(){
    if(skGloss)return Promise.resolve(skGloss);
    if(!skGlossP)skGlossP=fetch('/data/skills-glossary.json').then(function(r){return r.json();}).then(function(j){
      skGloss={};(j||[]).forEach(function(e){skGloss[e.slug]=e;});return skGloss;
    }).catch(function(){skGlossP=null;return null;});
    return skGlossP;
  }
  function skillSheetEl(){
    var el=document.getElementById('skmodal');
    if(el)return el;
    el=document.createElement('div');
    el.className='skmodal';el.id='skmodal';
    el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Skill definition');
    el.innerHTML='<div class="veil" id="skveil"></div>'+
      '<div class="sksheet" id="sksheet" tabindex="-1">'+
        '<button class="xclose sk-close" id="skclose" aria-label="Close">&times;</button>'+
        '<span class="lbl" id="skfield"></span>'+
        '<div class="sk-term"><span class="sk-mark" id="skmark"></span><span id="skterm"></span></div>'+
        '<p class="sk-def" id="skdef"></p>'+
        '<div class="gloss-unlocks" id="skunlocks" hidden><span class="lbl">Open roles it unlocks</span><span class="gu-list" id="skulist"></span></div>'+
        '<a class="lbl sk-gloss" id="skgloss" href="/glossary">Show in glossary →</a>'+
      '</div>';
    document.body.appendChild(el);
    function close(){
      if(el.classList.contains('closing')||!el.classList.contains('open'))return;
      el.classList.add('closing');
      setTimeout(function(){el.classList.remove('open');el.classList.remove('closing');},190);
    }
    el.querySelector('#skveil').addEventListener('click',close);
    el.querySelector('#skclose').addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
    return el;
  }
  function openSkillSheet(slug,fallbackName){
    var el=skillSheetEl();
    fetchSkillGloss().then(function(g){
      var e=g&&g[slug];
      if(!e){window.location.href='/glossary#skill-'+slug;return;}
      el.querySelector('#skfield').textContent=e.field||'Skill bank';
      el.querySelector('#skterm').textContent=e.term||fallbackName||'';
      // Brand marks paint filled, house glyphs stroked — same rule as the
      // server-rendered chips in jobs/SkillMark.tsx.
      var mk=el.querySelector('#skmark'),m=e.mark;
      mk.innerHTML=m?('<svg viewBox="'+m.v+'" aria-hidden="true"'+
        (m.s?' fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"':'')+
        '><path d="'+m.d+'"'+(m.s?'':' fill="currentColor"')+'/></svg>'):'';
      el.querySelector('#skdef').textContent=e.def||'';
      var un=el.querySelector('#skunlocks'),ul=el.querySelector('#skulist');
      ul.innerHTML='';
      var us=e.unlocks||[];
      un.hidden=!us.length;
      us.forEach(function(u){
        var a=document.createElement('a');a.className='gu-link';a.href='/jobs/'+u.slug;
        a.appendChild(document.createTextNode(u.title));
        var n=document.createElement('span');n.className='gu-n';n.textContent=u.count;a.appendChild(n);
        ul.appendChild(a);
      });
      el.querySelector('#skgloss').setAttribute('href','/glossary#skill-'+slug);
      el.classList.add('open');
      // Focus the sheet, not the close button: a programmatic focus ring on a
      // button paints accent, and the accent belongs to the data.
      var s=el.querySelector('#sksheet');if(s)s.focus();
    });
  }
  if(!window.__skillSheetWired){
    window.__skillSheetWired=true;
    document.addEventListener('mouseover',function(ev){
      if(ev.target&&ev.target.closest&&ev.target.closest('a.tag[href^="/glossary#skill-"]'))fetchSkillGloss();
    });
    document.addEventListener('click',function(ev){
      if(ev.defaultPrevented||ev.button!==0||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;
      // Phones fall through to the glossary link — same rule as the job-detail
      // strip: no sheet stacking on a small screen.
      if(window.matchMedia&&window.matchMedia('(max-width: 760px)').matches)return;
      var a=ev.target&&ev.target.closest?ev.target.closest('a.tag[href^="/glossary#skill-"]'):null;
      if(!a)return;
      ev.preventDefault();
      openSkillSheet(a.getAttribute('href').split('#skill-')[1],a.textContent);
    });
  }
  // The report request goes to /api/roadmap, which builds the six-page PDF and
  // emails it. destId is the selected route (a role's id, or a bridged kid's
  // slug); the current origin's top route is the default when nothing is picked.
  function currentDestId(){
    if(xsel&&xsel.kind==='kid'&&xsel.kid) return xsel.kid.slug;
    if(xsel&&xsel.kind==='role'&&xsel.role) return xsel.role.id;
    return ROLES[0]&&ROLES[0].id;
  }
  function showNote(em,msg){
    var note=em.parentNode.querySelector('.send-note');
    if(!note){note=document.createElement('div');note.className='fnote send-note';note.style.color='var(--ink)';em.parentNode.insertBefore(note,em.nextSibling);}
    note.textContent=msg;
  }
  function clearNote(em){var n=em.parentNode.querySelector('.send-note');if(n)n.remove();}
  function sendReport(em,btn,label,source,notify){
    if(!em||!em.value||!em.checkValidity()){showNote(em,'Enter a valid email first.');em.focus();return;}
    clearNote(em);
    var span=btn.querySelector('span')||btn;
    var was=span.textContent; span.textContent='Sending\u2026'; btn.disabled=true;
    fetch('/api/roadmap',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      email:em.value.trim(), originSlug:DATA.originSlug, destId:currentDestId(),
      notify:!!notify, personalized:!!DATA.personalized, source:source
    })}).then(function(r){return r.json().catch(function(){return{};});}).then(function(j){
      if(j&&j.ok){ span.textContent=j.delivered?'Sent \u2014 check your inbox':'You\u2019re on the list \u2014 report on its way'; }
      else { btn.disabled=false; span.textContent=was; showNote(em, (j&&j.error==='invalid-email')?'Enter a valid email first.':'Something went wrong. Try again.'); }
    }).catch(function(){ btn.disabled=false; span.textContent=was; showNote(em,'Network hiccup \u2014 try again.'); });
  }
  var xsend=document.getElementById('xsend');
  if(xsend){xsend.addEventListener('click',function(){
    sendReport(document.getElementById('xemail'),xsend,'Send my report','graph-export',false);
  });}
  var capBtn=document.getElementById('capBtn');
  if(capBtn){capBtn.addEventListener('click',function(){
    var wrap=capBtn.closest('.capture')||document;
    var em=wrap.querySelector('input[type="email"]');
    var chk=wrap.querySelector('input[type="checkbox"]');
    sendReport(em,capBtn,'Send my roadmap','capture-band',chk&&chk.checked);
  });}

  function loadOrigin(nd){ DATA=nd; derive(); seedCompressed(); initLabels(); buildDOM(); buildRail(); hydrateStatic(); runUnfold(); }
  return { loadOrigin: loadOrigin };
}
