'use strict';
const assert=require('node:assert/strict'),P=require('./physics.js');let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
function near(a,b,tol=1e-10){assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);}
function matrixNear(a,b,tol=1e-10){a.forEach((r,i)=>r.forEach((v,j)=>near(v,b[i][j],tol)));}
const transpose=a=>a[0].map((_,i)=>a.map(r=>r[i]));
const J=Array.from({length:6},()=>Array(6).fill(0));for(let i=0;i<6;i+=2){J[i][i+1]=1;J[i+1][i]=-1;}
const beam={energy:44,n:12000,seed:7902026,emitX:2,emitY:2,betaX:3,betaY:3,alphaX:0,alphaY:0,sigmaZ:1,sigmaDelta:.001,poly:[0,0,0,0]};
test('Reference rigidity at 44 MeV',()=>near(P.reference(44).brho,.148460,1e-5));
test('Drift, quad, bend, edges, and thick TDC are symplectic',()=>{for(const m of [P.drift(1,44),P.quad(.2,1,44),P.bend(.3,.2,44),P.edge(.5,.1),P.tdc(.3,2,'x',1.3,0,44).m,P.tdc(.3,2,'y',1.3,35,44).m])matrixNear(P.mul(P.mul(transpose(m),J),m),J);});
test('Zero gradient quad and zero angle bend reduce to drift',()=>{matrixNear(P.quad(.4,0,44),P.drift(.4,44));matrixNear(P.bend(.4,0,44),P.drift(.4,44));});
test('Sector dipole analytic dispersion and path length',()=>{const m=P.bend(.5,.2,44);near(m[0][5],2.5*(1-Math.cos(.2)));near(m[4][5],.5/P.reference(44).gamma**2-2.5*(.2-Math.sin(.2)));});
test('Thick TDC has kappa squared L / 6 and reciprocal coupling',()=>{const {m}=P.tdc(.3,2,'x',1.3,0,44);near(m[5][4],4*.3/6);near(m[0][4],.3);near(m[1][4],2);near(m[5][0],2);near(m[5][1],.3);});
test('TDC full map equals distributed partial maps, including affine kick',()=>{const p=new Float64Array([.001,.002,.003,-.001,.002,.001]);for(const axis of ['x','y']){const full=P.tdc(.4,3,axis,1.3,42,44),part=P.tdc(.2,1.5,axis,1.3,42,44);const a=P.map(p,full.m,full.b),b=P.map(P.map(p,part.m,part.b),part.m,part.b);a.forEach((v,i)=>near(v,b[i]));}});
test('90 degree TDC gives centroid kick, no z slope; frequency sets kick at fixed kappa',()=>{const a=P.tdc(.3,2,'y',1.3,90,44),b=P.tdc(.3,2,'y',2.6,90,44);near(a.m[3][4],0);assert.ok(a.b[3]>0);near(a.b[3],2*b.b[3]);near(a.b[2],.15*a.b[3]);});
test('Hard edges focus with independently adjustable signs',()=>{const a=P.edge(1,.2),b=P.edge(1,-.2);near(a[1][0],Math.tan(.2));near(a[3][2],-Math.tan(.2));matrixNear(P.mul(a,b),P.eye());});
test('Seeded beam is deterministic and polynomial chirp uses mm',()=>{const a=P.generate(beam),b=P.generate({...beam,poly:[.01,.002,0,0],sigmaDelta:0});assert.deepEqual(a,P.generate(beam));for(let k=0;k<a.length;k+=6){const u=a[k+4]*1e3;near(b[k+5],.01*u+.002*u*u);}});
test('Slits restrict correct plane, width and offset',()=>{const p=new Float64Array([-.001,0,.002,0,0,0,0,0,0,0,0,0,.001,0,-.002,0,0,0]);assert.equal(P.slit(p,'x',.0002,.001).length,6);assert.equal(P.slit(p,'y',.0002,0).length,6);assert.equal(P.slit(p,'x',.0001,1).length,0);});
test('Centered RMS is independent of centroid',()=>{const st=P.fastStats(new Float64Array([2,0,5,0,0,0,4,0,9,0,0,0]));near(st.sx,1);near(st.sy,2);});
test('Screen before slit retains all particles; screen at slit uses survivors; extension does not alter screen',()=>{const p=P.generate(beam),line=[{id:1,name:'S1',type:'slit',axis:'x',s:1,L:0,width:.1,center:0}];const before=P.transport(p,line,44,.5,1),at=P.transport(p,line,44,1,1),after=P.transport(p,line,44,2,0);assert.equal(before.stats.n,beam.n);assert.ok(at.stats.n<beam.n);assert.equal(at.stats.n,after.stats.n);assert.deepEqual(P.transport(p,line,44,.5,0).particles,before.particles);});
test('Screen inside quad equals exact partial map',()=>{const p=P.generate(beam),q={type:'quad',s:0,L:1,G:.4};const r=P.transport(p,[q],44,.37,.9),expected=P.map(p,P.quad(.37,.4,44));r.particles.forEach((v,i)=>near(v,expected[i]));});
test('Screen inside bend applies entrance edge only',()=>{const p=P.generate(beam),e={type:'dipole',s:0,L:1,angle:20,edgeIn:10,edgeOut:10};const r=P.transport(p,[e],44,.3,.8),expected=P.map(P.map(p,P.edge(20*Math.PI/180,10*Math.PI/180)),P.bend(.3,6*Math.PI/180,44));r.particles.forEach((v,i)=>near(v,expected[i]));});
test('Dipole body and both edges compose at exit',()=>{const p=P.generate(beam),e={type:'dipole',s:0,L:1,angle:20,edgeIn:10,edgeOut:-5};const r=P.transport(p,[e],44,1,0),h=20*Math.PI/180,expected=P.map(P.map(P.map(p,P.edge(h,10*Math.PI/180)),P.bend(1,h,44)),P.edge(h,-5*Math.PI/180));r.particles.forEach((v,i)=>near(v,expected[i]));});
test('Empty beam and zero screen are well-defined',()=>{const p=P.generate(beam),line=[{type:'slit',name:'Closed',s:0,L:0,axis:'x',width:.001,center:999}];assert.equal(P.transport(p,line,44,1,.5).stats.sx,null);assert.deepEqual(P.transport(p,[],44,0,0).particles,p);});
test('Invalid overlapping elements and non-finite values are rejected',()=>{assert.throws(()=>P.validate([{type:'quad',s:1,L:1,G:1},{type:'drift',s:1.5,L:1}],4,.5));assert.throws(()=>P.validate([{type:'tdc',s:1,L:.2,kappa:2,phase:0,frequency:0,axis:'x'}],4,.5));assert.throws(()=>P.validateBeam({...beam,poly:[NaN,0,0,0]}));});
console.log(`${count} physics checks passed.`);
