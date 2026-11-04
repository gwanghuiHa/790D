'use strict';
const assert=require('node:assert/strict'),P=require('./physics.js'),L=require('./presets.js'),base=require('./defaults.json');let count=0;
function near(a,b,tol=1e-12){assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);}
function test(name,fn){fn();count++;console.log('PASS '+name);}
const rad=d=>d*Math.PI/180;
function multiply(a,b){return a.map((row,i)=>b[0].map((_,j)=>row.reduce((s,v,k)=>s+v*b[k][j],0)));}
function transpose(a){return a[0].map((_,j)=>a.map(row=>row[j]));}
const J=Array.from({length:6},()=>Array(6).fill(0));for(let i=0;i<6;i+=2){J[i][i+1]=1;J[i+1][i]=-1;}
function compare(a,b){a.forEach((v,i)=>near(v,b[i]));}
test('Fixed model assumptions are 10 mm half-gap and FINT 0.5',()=>{assert.deepEqual(P.DIPOLE_FRINGE,{halfGap:.01,fint:.5});assert.ok(Object.isFrozen(P.DIPOLE_FRINGE));});
test('Psi matches the MAD-X full-gap convention at nonzero pole angle',()=>{const h=.8,e=.2;near(P.fringePsi(h,e),.02*.5*h*(1+Math.sin(e)**2)/Math.cos(e));});
test('10 degree, 0.2 m bend has a 0.5 degree zero-edge correction',()=>{const h=rad(10)/.2;near(P.fringePsi(h,0),rad(.5));near(P.edge(h,0)[3][2],.007615628822,1e-11);});
test('Zero edge angle gives vertical defocusing for either bend direction',()=>{for(const h of [.8,-.8]){assert.ok(P.edge(h,0)[3][2]>0);near(P.edge(h,0)[1][0],0);}near(P.edge(.8,0)[3][2],P.edge(-.8,0)[3][2]);});
test('Zero curvature gives identity; zero gap recovers old hard edges',()=>{assert.deepEqual(P.edge(0,.2),P.eye());const m=P.edge(.8,.2,0);near(m[1][0],.8*Math.tan(.2));near(m[3][2],-.8*Math.tan(.2));});
test('Fringe correction leaves all other matrix entries unchanged',()=>{const a=P.edge(.8,.2),b=P.edge(.8,.2,0);for(let i=0;i<6;i++)for(let j=0;j<6;j++)if(i!==3||j!==2)near(a[i][j],b[i][j]);assert.notEqual(a[3][2],b[3][2]);});
test('Corrected edge and complete dipole matrices are symplectic',()=>{const h=rad(20)/.3,edge=P.edge(h,rad(10)),full=P.mul(edge,P.mul(P.bend(.3,rad(20),44),edge));for(const M of [edge,full]){const check=multiply(multiply(transpose(M),J),M);check.forEach((row,i)=>row.forEach((v,j)=>near(v,J[i][j])));}});
test('Tracking applies each corrected face once and matches analytic vertical ray',()=>{const e={id:1,name:'B',type:'dipole',s:0,L:.2,angle:10,edgeIn:0,edgeOut:0},ray=new Float64Array([0,0,.001,0,0,0]),h=rad(10)/.2,k=h*Math.tan(.02*.5*h);const r=P.transport(ray,[e],44,.7,0),yExit=(1+.2*k)*.001,ypExit=(2*k+.2*k*k)*.001;near(r.particles[2],yExit+.5*ypExit);near(r.particles[3],ypExit);assert.ok(r.particles[2]>.001);});
test('An internal screen applies entrance fringe but not exit fringe',()=>{const e={id:1,name:'B',type:'dipole',s:0,L:.2,angle:10,edgeIn:0,edgeOut:0},ray=new Float64Array([0,0,.001,0,0,0]),h=rad(10)/.2,k=h*Math.tan(.02*.5*h);const p=P.transport(ray,[e],44,.1,.5).particles;near(p[2],.001*(1+.1*k));near(p[3],.001*k);});
test('Screen beyond exit and plot extension do not double-apply fringe kicks',()=>{const e={id:1,name:'B',type:'dipole',s:0,L:.2,angle:10,edgeIn:0,edgeOut:0},ray=new Float64Array([.001,.0001,.001,0,.001,.001]),a=P.transport(ray,[e],44,.7,0),b=P.transport(ray,[e],44,.7,2);compare(a.particles,b.particles);});
test('Existing saved presets load without adding or changing stored fields',()=>{const original=JSON.stringify(base),catalog=L.normalize(base);for(const p of catalog.presets){P.validateBeam(p.beam);P.validate(p.line,p.screen,p.extension);const copy=JSON.stringify(p.line);P.transport(P.generate(p.beam),p.line,p.beam.energy,p.screen,p.extension);assert.equal(JSON.stringify(p.line),copy);}assert.equal(JSON.stringify(base),original);});
console.log(`${count} fringe checks passed.`);
