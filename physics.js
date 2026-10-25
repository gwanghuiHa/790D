/* PHYS 790D — first-order electron optics. Coordinates [x,x',y,y',z,delta]. */
(function(root){
'use strict';
const C=299792458, MC2=.51099895;
const eye=()=>Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>+(i===j)));
const mul=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((s,v,k)=>s+v*b[k][j],0)));
function reference(E){const gamma=1+E/MC2,beta=Math.sqrt(1-1/gamma**2);return {gamma,beta,brho:Math.sqrt(E*(E+2*MC2))/.299792458/1000};}
function drift(L,E){let m=eye();m[0][1]=m[2][3]=L;m[4][5]=L/reference(E).gamma**2;return m;}
function plane(K,L){if(Math.abs(K)<1e-16)return [[1,L],[0,1]];const k=Math.sqrt(Math.abs(K)),f=k*L;return K>0?[[Math.cos(f),Math.sin(f)/k],[-k*Math.sin(f),Math.cos(f)]]:[[Math.cosh(f),Math.sinh(f)/k],[k*Math.sinh(f),Math.cosh(f)]];}
function quad(L,G,E){let m=drift(L,E);for(const [i,K] of [[0,G/reference(E).brho],[2,-G/reference(E).brho]]){const q=plane(K,L);m[i][i]=q[0][0];m[i][i+1]=q[0][1];m[i+1][i]=q[1][0];m[i+1][i+1]=q[1][1];}return m;}
function bend(L,theta,E){if(Math.abs(theta)<1e-10)return drift(L,E);const h=theta/L,s=Math.sin(theta),c=Math.cos(theta),d=1-c;let m=drift(L,E);m[0][0]=m[1][1]=c;m[0][1]=s/h;m[1][0]=-h*s;m[0][5]=d/h;m[1][5]=s;m[4][0]=-s;m[4][1]=-d/h;m[4][5]-=(theta-s)/h;return m;}
function edge(h,angle){let m=eye();m[1][0]=h*Math.tan(angle);m[3][2]=-h*Math.tan(angle);return m;}
// Uniform distributed deflector, ultrarelativistic transit approximation.
// This exact thick map includes R_(delta,z)=k^2 L/6, not a drift-kick-drift surrogate.
function tdc(L,kappa,axis,frequency,phase,E){
 const i=axis==='y'?2:0,ph=phase*Math.PI/180,k=kappa*Math.cos(ph),krf=2*Math.PI*frequency*1e9/(reference(E).beta*C),kick=kappa/krf*Math.sin(ph),m=eye(),b=Array(6).fill(0);
 m[0][1]=m[2][3]=L;m[i][4]=k*L/2;m[i+1][4]=k;m[5][i]=k;m[5][i+1]=k*L/2;m[5][4]=k*k*L/6;
 b[i]=kick*L/2;b[i+1]=kick;b[5]=k*kick*L/6;
 return {m,b};
}
function map(p,m,b){const out=new Float64Array(p.length);for(let n=0;n<p.length;n+=6)for(let i=0;i<6;i++){let v=b?b[i]:0;for(let j=0;j<6;j++)v+=m[i][j]*p[n+j];if(!Number.isFinite(v)||Math.abs(v)>1e100)throw Error('Transport diverged. Reduce the element strengths or lengths.');out[n+i]=v;}return out;}
function stats(p){const n=p.length/6;if(!n)return {n:0,mean:Array(6).fill(0),cov:eye().map(r=>r.map(()=>0)),sx:null,sy:null};const mean=Array(6).fill(0);for(let k=0;k<p.length;k++)mean[k%6]+=p[k]/n;let cov=Array.from({length:6},()=>Array(6).fill(0));for(let k=0;k<p.length;k+=6)for(let i=0;i<6;i++)for(let j=0;j<=i;j++)cov[i][j]+=(p[k+i]-mean[i])*(p[k+j]-mean[j])/n;for(let i=0;i<6;i++)for(let j=0;j<i;j++)cov[j][i]=cov[i][j];return {n,mean,cov,sx:Math.sqrt(Math.max(0,cov[0][0])),sy:Math.sqrt(Math.max(0,cov[2][2]))};}
function fastStats(p){const n=p.length/6;if(!n)return {n:0,sx:null,sy:null,mx:0,my:0};let mx=0,my=0;for(let k=0;k<p.length;k+=6){mx+=p[k]/n;my+=p[k+2]/n;}let vx=0,vy=0;for(let k=0;k<p.length;k+=6){vx+=(p[k]-mx)**2/n;vy+=(p[k+2]-my)**2/n;}return {n,sx:Math.sqrt(vx),sy:Math.sqrt(vy),mx,my};}
function slit(p,axis,width,center){const i=axis==='y'?2:0,out=[];for(let k=0;k<p.length;k+=6)if(Math.abs(p[k+i]-center)<=width/2)for(let j=0;j<6;j++)out.push(p[k+j]);return new Float64Array(out);}
function generate(b){let seed=b.seed>>>0;function rand(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return (seed+.5)/4294967296;}function normal(){return Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());}const p=new Float64Array(b.n*6),bg=reference(b.energy),egx=b.emitX*1e-6/(bg.beta*bg.gamma),egy=b.emitY*1e-6/(bg.beta*bg.gamma);
 for(let k=0;k<p.length;k+=6){const ax=normal(),bx=normal(),ay=normal(),by=normal(),z=normal()*b.sigmaZ*1e-3,u=z*1e3;p[k]=Math.sqrt(egx*b.betaX)*ax;p[k+1]=Math.sqrt(egx/b.betaX)*(bx-b.alphaX*ax);p[k+2]=Math.sqrt(egy*b.betaY)*ay;p[k+3]=Math.sqrt(egy/b.betaY)*(by-b.alphaY*ay);p[k+4]=z;p[k+5]=normal()*b.sigmaDelta+b.poly.reduce((s,a,i)=>s+a*u**(i+1),0);}
 return p;}
function validateBeam(b){for(const key of ['energy','emitX','emitY','betaX','betaY','sigmaZ'])if(!Number.isFinite(b[key])||b[key]<=0)throw Error('Beam '+key+' must be positive.');if(!Number.isInteger(b.n)||b.n<100||b.n>50000)throw Error('Use 100–50,000 particles.');if(!Number.isInteger(b.seed)||b.seed<0||b.seed>4294967295)throw Error('Seed must be an integer from 0 to 4294967295.');for(const key of ['alphaX','alphaY','sigmaDelta'])if(!Number.isFinite(b[key]))throw Error('Invalid beam '+key);if(b.sigmaDelta<0)throw Error('Energy spread cannot be negative.');if(!Array.isArray(b.poly)||b.poly.length!==4||b.poly.some(x=>!Number.isFinite(x)))throw Error('Four finite polynomial coefficients are required.');}
function validate(line,screen,extra){if(!Number.isFinite(screen)||screen<0||!Number.isFinite(extra)||extra<0||screen+extra>1000)throw Error('Screen and extension must be nonnegative; plot end must be ≤1000 m.');if(!Array.isArray(line)||line.length>100)throw Error('Use at most 100 elements.');const sorted=line.map(e=>({...e})).sort((a,b)=>a.s-b.s);let end=0;for(const e of sorted){if(!['drift','quad','dipole','tdc','slit'].includes(e.type))throw Error('Unknown element type.');if(!Number.isFinite(e.s)||e.s<0||e.s>1000)throw Error('Element entrance must be between 0 and 1000 m.');if(!Number.isFinite(e.L)||e.L<0||(e.type!=='slit'&&e.L<.0001))throw Error('Finite elements need a length ≥0.0001 m.');if(e.s<end-1e-10)throw Error('Elements overlap. Edit entrance positions or lengths.');if(e.type==='slit'){if(e.L!==0)throw Error('Slits are zero-length apertures.');if(!['x','y'].includes(e.axis)||!Number.isFinite(e.width)||e.width<=0||!Number.isFinite(e.center))throw Error('Slit needs a valid axis, positive width and finite center.');}
 if(e.type==='quad'&&!Number.isFinite(e.G))throw Error('Invalid quadrupole gradient.');if(e.type==='dipole'){if(![e.angle,e.edgeIn,e.edgeOut].every(Number.isFinite)||Math.abs(e.angle)>179||Math.abs(e.edgeIn)>=85||Math.abs(e.edgeOut)>=85)throw Error('Bend angle must be within ±179°; edges within ±85°.');}if(e.type==='tdc'&&(!['x','y'].includes(e.axis)||![e.kappa,e.frequency,e.phase].every(Number.isFinite)||e.frequency<=0))throw Error('Invalid TDC settings.');end=Math.max(end,e.s+e.L);}return sorted;}
function transport(initial,line,energy,screen,extra){
 const sorted=validate(line,screen,extra),limit=screen+extra,points=[],slits=[];let p=initial,s=0,screenParticles=null;const tol=1e-10;
 function record(){const st=fastStats(p);points.push({s,...st});}
 function snap(){if(Math.abs(s-screen)<tol)screenParticles=p;}
 function travel(to,makeMap){const start=s,L=to-start;if(L<=tol){s=to;return;}let cuts=[];const n=Math.max(1,Math.ceil(L/Math.max(limit/150,.02)));for(let i=1;i<=n;i++)cuts.push(start+L*i/n);if(screen>start+tol&&screen<to-tol)cuts.push(screen);cuts.sort((a,b)=>a-b);const input=p;for(const at of cuts){const t=makeMap(at-start);p=map(input,t.m||t,t.b);s=at;record();snap();}}
 record();snap();for(const e of sorted){if(e.s>limit+tol)break;travel(Math.min(e.s,limit),l=>drift(l,energy));if(s>=limit+tol)break;
 if(e.type==='slit'){p=slit(p,e.axis,e.width*1e-3,e.center*1e-3);slits.push({s,n:p.length/6,name:e.name});record();snap();continue;}
 if(e.s>=limit-tol)break;
 if(e.type==='dipole'){p=map(p,edge((e.angle*Math.PI/180)/e.L,e.edgeIn*Math.PI/180));record();snap();}
 const target=Math.min(e.s+e.L,limit);travel(target,l=>{if(e.type==='drift')return drift(l,energy);if(e.type==='quad')return quad(l,e.G,energy);if(e.type==='dipole')return bend(l,e.angle*Math.PI/180*l/e.L,energy);return tdc(l,e.kappa*l/e.L,e.axis,e.frequency,e.phase,energy);});
 if(e.type==='dipole'&&Math.abs(s-(e.s+e.L))<tol){p=map(p,edge(e.angle*Math.PI/180/e.L,e.edgeOut*Math.PI/180));record();snap();}
 if(s>=limit-tol)break;}
 if(s<limit-tol)travel(limit,l=>drift(l,energy));if(screenParticles===null&&Math.abs(screen)<tol)screenParticles=initial;if(screenParticles===null)throw Error('Screen could not be evaluated.');return {points,particles:screenParticles,stats:fastStats(screenParticles),slits,end:limit};
}
const api={eye,mul,reference,drift,quad,bend,edge,tdc,map,stats,fastStats,slit,generate,validateBeam,validate,transport};if(typeof module!=='undefined')module.exports=api;else root.Optics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
