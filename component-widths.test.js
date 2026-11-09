'use strict';
const assert=require('node:assert/strict'),P=require('./physics'),L=require('./presets');
const b={energy:44,n:16000,seed:79004,emitX:2,emitY:2,betaX:3,betaY:3,alphaX:0,alphaY:0,sigmaZ:1,sigmaDelta:.001,poly:[0,0,0,0],profileConvention:'component'};
const close=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`);
let checks=0;function test(name,f){f();checks++;console.log('PASS '+name);}
function spec(shape='gaussian',count=4,separation=8){return {shape,count,separation};}
function groups(a,spacing,count){const out=Array.from({length:count},()=>[]);for(const v of a){const j=Math.max(0,Math.min(count-1,Math.round(v/spacing+(count-1)/2)));out[j].push(v);}return out;}
function moments(a){const mean=a.reduce((s,v)=>s+v/a.length,0);return {mean,rms:Math.sqrt(a.reduce((s,v)=>s+(v-mean)**2/a.length,0))};}
test('Each of four separated bunches retains the entered 1 mm RMS',()=>{const p=P.generate({...b,profiles:{z:spec('gaussian',4,12)}}),z=Array.from({length:b.n},(_,i)=>p[6*i+4]*1000);for(const [i,g] of groups(z,12,4).entries()){assert.equal(g.length,4000);close(moments(g).mean,(i-1.5)*12);close(moments(g).rms,1);}close(moments(z).rms,Math.sqrt(181));});
test('Component widths remain fixed when count or separation changes',()=>{for(const count of [2,4,8])for(const separation of [8,12]){const p=P.generate({...b,profiles:{z:spec('uniform',count,separation)}}),z=Array.from({length:b.n},(_,i)=>p[6*i+4]*1000);for(const g of groups(z,separation,count))close(moments(g).rms,1);close(moments(z).rms,Math.sqrt(1+separation**2*(count**2-1)/12));}});
test('All six coordinates accept large component separation with fixed widths',()=>{const bg=P.reference(b.energy),e=b.emitX*1e-6/(bg.beta*bg.gamma),scales=[Math.sqrt(e*b.betaX),Math.sqrt(e/b.betaX),Math.sqrt(e*b.betaY),Math.sqrt(e/b.betaY),.001,.001];for(const [index,key] of P.PROFILE_COORDS.entries()){const p=P.generate({...b,profiles:{[key]:spec('uniform')}}),a=Array.from({length:b.n},(_,i)=>p[6*i+index]/scales[index]);for(const g of groups(a,8,4))close(moments(g).rms,1);}});
test('Polynomial chirp still applies after generating the train',()=>{const cfg={...b,profiles:{z:spec()}},a=P.generate(cfg),p=P.generate({...cfg,poly:[.001,.0001,0,0]});for(let i=0;i<p.length;i+=6){const u=p[i+4]*1000;close(p[i+5]-a[i+5],.001*u+.0001*u*u);}});
test('New convention survives preset save/load',()=>{const preset=L.preset({id:'new',name:'New',beam:{...b,profiles:{z:spec()}},line:[],screen:1,extension:.1});assert.equal(JSON.parse(JSON.stringify(preset)).beam.profileConvention,'component');});
test('Legacy total-width files retain old limits; bad convention rejected',()=>{assert.throws(()=>P.generate({...b,profileConvention:'total',profiles:{z:spec()}}));assert.throws(()=>P.generate({...b,profileConvention:'bad'}));});
console.log(checks+' component width checks passed.');
