/* eslint-disable */
// Physics ported verbatim from the reference; only data source + accent color changed.

export function mountInstrument(DATA){
  var PILL_W=108,PILL_H=24;   /* wordmark clearance zone */
  var ROLES,NEXT,GNODES,GEDGES,NODE_BY_ID,NBRS;
  function derive(){
    ROLES=DATA.roles; NEXT=DATA.next;
    ROLES.forEach(function(rl){rl.next=NEXT[rl.id]||[];});
    GNODES=[{id:'you',type:'you',label:DATA.originLabel,match:100}];
    ROLES.forEach(function(r){GNODES.push({id:r.id,type:'first',label:r.title,match:r.match});});
    Object.keys(NEXT).forEach(function(pid){NEXT[pid].forEach(function(k,i){GNODES.push({id:pid+'_'+i,type:'kid',label:(k.t||'').replace(/&amp;/g,'&'),match:k.m,parent:pid});});});
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
      else if(n.type==='first'){n.lblW=Math.max(t.length*12.5*0.6,9*9.5*0.72)+8;n.lblH=30;}
      else{n.lblW=t.length*10.5*0.6+8;n.lblH=16;}
    });
  }
  derive();
  function hydrateStatic(){
    var q=function(x){return document.querySelector(x);};
    var lbl=q('.band-head .lbl'); if(lbl)lbl.innerHTML=DATA.personalized?('Career graph · '+DATA.originLabel+' · personalized from '+DATA.skillCount+' skills'):('Career graph · '+DATA.originLabel);
    var sc=q('.band-head .score b'); if(sc&&ROLES[0])sc.textContent=ROLES[0].match;
    var freq={};ROLES.forEach(function(r){(r.have||[]).concat(r.learn||[]).forEach(function(sk){freq[sk]=(freq[sk]||0)+1;});});
    var top=Object.keys(freq).sort(function(a,b){return freq[b]-freq[a];}).slice(0,6);
    var sk=q('.proof .sk'); if(sk){sk.innerHTML='<span class="cap">In demand across your routes</span>'+top.join(' · ');}
    var stats=document.querySelectorAll('.proof .fstat .v');
    if(stats[0])stats[0].textContent=ROLES.length;
    if(stats[1])stats[1].textContent=DATA.postings?DATA.postings.toLocaleString():'\u2014';
    var role=document.getElementById('qRole'); if(role)role.placeholder=DATA.originLabel;
  }
  function nodeRadius(n){if(n.type==='you')return 12;if(n.type==='first')return 3+n.match/24;return 3;}

  /* ══ node physics — anisotropic gravity for a wide ellipse ══ */
  var CX=450,CY=320;
  var SVG=document.getElementById('graph');
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
      if(n.x<40){n.x=40;n.vx=0;}else if(n.x>860){n.x=860;n.vx=0;}
      if(n.y<36){n.y=36;n.vy=0;}else if(n.y>604){n.y=604;n.vy=0;}
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
      n.lAvgX=undefined;n.lAvgY=undefined;n.lStable=0;
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
      for(var jj=0;jj<GNODES.length;jj++){
        var o=GNODES[jj];
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
        var cushion=nodeRadius(o)+8;
        var dx2=n.lx-o.x,dy2=n.ly-o.y;
        var dsq=dx2*dx2+dy2*dy2;
        if(dsq<cushion*cushion&&dsq>0.1){
          var d2=Math.sqrt(dsq);
          var pp=(cushion-d2)*0.5;
          n.lvx+=(dx2/d2)*pp;n.lvy+=(dy2/d2)*pp;
        }
      }
      var halfWL=n.lblW/2,halfHL=n.lblH/2;
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
      n.lvx*=0.62;n.lvy*=0.62;
      if(n.lvx>-0.04&&n.lvx<0.04)n.lvx=0;
      if(n.lvy>-0.04&&n.lvy<0.04)n.lvy=0;
      n.lx+=n.lvx;n.ly+=n.lvy;
      if(n.lAvgX===undefined){n.lAvgX=n.lx;n.lAvgY=n.ly;n.lStable=0;}
      else{n.lAvgX=n.lAvgX*0.85+n.lx*0.15;n.lAvgY=n.lAvgY*0.85+n.ly*0.15;}
      var ddx=n.lx-n.lAvgX,ddy=n.ly-n.lAvgY;
      var devSq=ddx*ddx+ddy*ddy;
      var velSq=n.lvx*n.lvx+n.lvy*n.lvy;
      if(devSq<0.6&&velSq<0.4){
        n.lStable++;
        if(n.lStable>6){n.lx=n.lAvgX;n.ly=n.lAvgY;n.lvx=0;n.lvy=0;}
      }else n.lStable=0;
    }
  }

  /* ══ auto-fit viewBox to settled content ══ */
  function fitViewBox(){
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

  /* ══ state machine ══ */
  var hoveredLayer=null,clickedNode=null,dragging=null,unfolding=false;

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
      var stroke,sw,dash=null;
      if(e.k==='primary'){stroke='#002FA6';sw=0.6+e.w*0.8;}
      else if(e.k==='kid'){stroke='#4b60c9';sw=0.4+e.w*0.5;}
      else if(e.k==='cross'){stroke='#b8b0a0';sw=0.35+e.w*0.4;}
      else{stroke='#002FA6';sw=0.3+e.w*0.4;dash='2 3';}
      var attrs={'class':'edge',x1:e.a.x,y1:e.a.y,x2:e.b.x,y2:e.b.y,stroke:stroke,
        'stroke-width':sw,'stroke-opacity':0.15,'stroke-linecap':'round','pointer-events':'none'};
      if(dash)attrs['stroke-dasharray']=dash;
      var line=svgEl('line',attrs);
      edgesG.appendChild(line);el.edges[i]=line;
    });
    SVG.appendChild(edgesG);

    var nodesG=svgEl('g',{});
    GNODES.forEach(function(n){
      if(n.type!=='first')return;
      var c=svgEl('circle',{'class':'node node-first','data-id':n.id,'data-type':'first',
        'data-grabbable':'',cx:n.x,cy:n.y,r:nodeRadius(n),fill:'#002FA6',opacity:1});
      nodesG.appendChild(c);el.firstNodes[n.id]=c;
    });
    GNODES.forEach(function(n){
      if(n.type!=='kid')return;
      var c=svgEl('circle',{'class':'node node-kid','data-id':n.id,'data-type':'kid',
        'data-grabbable':'',cx:n.x,cy:n.y,r:2.8,fill:'#15151a',opacity:1});
      nodesG.appendChild(c);el.kidNodes[n.id]=c;
    });
    var you=NODE_BY_ID['you'];
    var youG=svgEl('g',{'class':'you-mark','data-id':'you'});
    /* Paper-colored knockout so edges terminating at center don't
       visually pass through the wordmark. Type is the mark. */
    youG.appendChild(svgEl('rect',{x:you.x-52,y:you.y-11,width:104,height:22,
      fill:'#faf9f5',stroke:'none','pointer-events':'none'}));
    var pt=svgEl('text',{x:you.x,y:you.y+5,'text-anchor':'middle','font-family':'Space Grotesk',
      'font-size':15,'letter-spacing':1.8,'font-weight':700,fill:'#15151a','pointer-events':'none'});
    pt.textContent=(you.label||'').toUpperCase();
    youG.appendChild(pt);
    nodesG.appendChild(youG);
    el.pill=youG;
    SVG.appendChild(nodesG);

    var labelsG=svgEl('g',{id:'labelsLayer'});
    GNODES.forEach(function(n){
      if(n.type==='you')return;
      var g=svgEl('g',{'class':'label-grp','data-id':n.id,opacity:n.type==='first'?1:0,'pointer-events':'none'});
      var leader=svgEl('line',{'class':'leader',stroke:'#b8b0a0','stroke-width':0.5,'stroke-opacity':0.75,x1:0,y1:0,x2:0,y2:0});
      g.appendChild(leader);
      if(n.type==='first'){
        var name=svgEl('text',{'text-anchor':'middle','font-family':'Space Grotesk','font-weight':500,'font-size':12.5,fill:'#15151a',x:0,y:0});
        name.textContent=n.label;g.appendChild(name);
        var match=svgEl('text',{'text-anchor':'middle','font-family':'Space Mono','font-size':9.5,'letter-spacing':1,fill:'#8a8a93',x:0,y:0});
        match.textContent=n.match+'% MATCH';g.appendChild(match);
        el.labelTexts[n.id]={name:name,match:match};
      }else{
        var name2=svgEl('text',{'text-anchor':'middle','font-family':'Space Grotesk','font-weight':400,'font-size':10.5,fill:'#56565e',x:0,y:0});
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
        texts.name.setAttribute('x',n.lx);texts.name.setAttribute('y',n.ly-3);
        texts.match.setAttribute('x',n.lx);texts.match.setAttribute('y',n.ly+11);
      }else{
        texts.name.setAttribute('x',n.lx);texts.name.setAttribute('y',n.ly+3.5);
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
      GNODES[i].lAvgX=undefined;GNODES[i].lAvgY=undefined;GNODES[i].lStable=0;
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

  function pills(a,c){return a.map(function(x){return '<span class="tag '+c+'">'+x+'</span>';}).join('');}

  function detailSignals(o){
    var rows='';
    function row(k,v){ if(v==null)return; v=Math.max(0,Math.min(100,Math.round(v)));
      rows+='<div class="d-sig-row"><span class="k">'+k+'</span><span class="t"><span class="f" style="width:'+v+'%"></span></span><span class="v">'+v+'</span></div>'; }
    row('Skill readiness',o.match);
    row('Shared abilities',o.capability);
    row('Commonly done',o.mobility);
    var src=(o.mobility==null)?'':(o.mobility_source==='observed-flow-us')?'observed US worker flow':(o.mobility_source==='observed-flow-eu')?'observed EU worker flow':(o.mobility_source==='related')?'O*NET related occupations':'';
    if(src)rows+='<div class="d-sig-src">'+src+'</div>';
    if(!rows)return '';
    return '<div class="dsk"><div class="cap">Why this fit</div><div class="d-sig">'+rows+'</div></div>';
  }
  function kindTag(o){
    if(!o.kind)return '';
    var txt=(o.kind==='lateral')?'Lateral':('Pivot → '+(o.cluster||''));
    return '<span class="lbl">'+txt+'</span>';
  }
  function setExportCTA(){var re=document.getElementById('railExport');if(re)re.innerHTML='<div class="d-export" onclick="openExport()"><div class="in"><span class="tx"><span class="a">Export this route</span><span class="b">Free PDF &middot; no account</span></span><svg viewBox="0 0 24 24"><use href="#i-export45"/></svg></div></div>';}
  function renderRoleDetail(rl){
    xsel={kind:'role',role:rl};
    setExportCTA();
    var d=document.getElementById('detail');if(!d)return;
    d.innerHTML=
      '<div class="d-cap"><span class="d-sector">'+rl.field+'</span>'+kindTag(rl)+'</div>'+
      '<div class="d-title">'+rl.title+'</div>'+
      '<div class="d-match"><span class="n">'+rl.match+'</span><span class="u">% match from architect</span></div>'+
      detailSignals(rl)+
      '<div class="drow"><span class="k">Avg salary</span><span class="v">'+rl.salary+'</span></div>'+
      '<div class="drow"><span class="k">Job demand</span><span class="v">'+rl.demand+'</span></div>'+
      '<div class="drow"><span class="k">Remote</span><span class="v">'+rl.remote+'</span></div>'+
      '<div class="drow"><span class="k">Transition</span><span class="v">'+rl.time+'</span></div>'+
      '<div class="dsk"><div class="cap">Skills you have</div><div class="tags">'+pills(rl.have,"have")+'</div></div>'+
      '<div class="dsk"><div class="cap">Skills to build</div><div class="tags">'+pills(rl.learn,"")+'</div></div>'+
      (rl.next.length?'<div class="dsk"><div class="cap">Opens paths to</div><div class="tags">'+pills(rl.next.map(function(x){return x.t;}),"")+'</div></div>':'');
  }
  function renderKidDetail(kid,parent){
    xsel={kind:'kid',kid:kid,parent:parent};
    setExportCTA();
    var d=document.getElementById('detail');if(!d)return;
    d.innerHTML=
      '<div class="d-cap"><span class="d-sector">Second hop</span><span class="lbl">Via '+parent.title+'</span></div>'+
      '<div class="d-title">'+kid.t+'</div>'+
      '<div class="d-match"><span class="n">'+kid.m+'</span><span class="u">% match at second hop</span></div>'+
      '<div class="drow"><span class="k">Path</span><span class="v">'+DATA.originLabel+' &rarr; '+parent.title+' &rarr; '+kid.t+'</span></div>'+
      '<div class="drow"><span class="k">Bridge role</span><span class="v">'+parent.title+'</span></div>'+
      '<div class="dsk"><div class="cap">How this pivot works</div><p style="font-size:13.5px;color:var(--ink-2);line-height:1.55;margin-top:4px">Reach this destination by first moving to '+parent.title+', which builds the foundation for a step into '+kid.t+' over the following 6&ndash;18 months. Two-hop moves take longer but open a wider range of destinations than a single pivot can.</p></div>';
  }
  function updateTrail(id){
    var tc=document.getElementById('trailCrumbs');if(!tc)return;
    var crumbs=[DATA.originLabel];
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

  SVG.addEventListener('mousemove',function(ev){
    if(unfolding)return;
    if(!dragging&&!clickedNode){
      var p=svgPoint(ev);
      var hit=hitTestNode(p.x,p.y);
      var newLayer=hit?(hit.type==='first'?'first':'kid'):null;
      if(newLayer!==hoveredLayer){hoveredLayer=newLayer;commitStateChange();}
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
    if(!dragging&&!clickedNode&&hoveredLayer!==null){hoveredLayer=null;commitStateChange();}
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
    var sorted=ROLES.slice().sort(function(a,b){return b.match-a.match;});
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
  if(goBtn)goBtn.addEventListener('click',function(){
    runUnfold();
    var band=document.getElementById('bandEl');
    var navH=document.querySelector('.nav').getBoundingClientRect().height;
    var searchH=document.querySelector('.searchbar').getBoundingClientRect().height;
    var stickyStack=navH+searchH-1;   /* -1: the shared border pixel row */
    var bandAbsY=band.getBoundingClientRect().top+window.scrollY;
    var target=bandAbsY-stickyStack;
    if(Math.abs(window.scrollY-target)>2){
      window.scrollTo({top:target,behavior:'smooth'});
    }
  });
  var cb=document.getElementById('capBtn');
  if(cb){cb.addEventListener('click',function(){cb.textContent='Sent \u2014 check your inbox';});}

  /* ══ init: silent settle from compressed seed → fit → unfold live ══ */
  seedCompressed();
  for(var s0=0;s0<520;s0++)stepNodes(0.88);
  initLabels();
  (function(){var act=activeLabelList();for(var s1=0;s1<260;s1++)stepLabels(act);})();
  buildDOM();
  fitViewBox();
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
  var xsend=document.getElementById('xsend');
  if(xsend){xsend.addEventListener('click',function(){xsend.querySelector('span').textContent='Sent — check your inbox';});}

  function loadOrigin(nd){ DATA=nd; derive(); seedCompressed(); buildDOM(); buildRail(); hydrateStatic(); runUnfold(); }
  return { loadOrigin: loadOrigin };
}
