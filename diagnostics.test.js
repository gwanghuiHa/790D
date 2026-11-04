'use strict';
const assert=require('node:assert/strict');
const D=require('./diagnostics.js');
let tests=0;function test(name,fn){fn();tests++;console.log('ok',name);}
function particles(points){return Float64Array.from(points.flatMap(([x,y])=>[x,0,y,0,0,0]));}
const sum=a=>a.reduce((s,x)=>s+x,0);
test('1D includes both boundaries and excludes outside',()=>{const h=D.histogram1D(particles([[-1,0],[0,0],[1,0],[2,0]]),0,1,4,1);assert.deepEqual([...h.bins],[1,0,1,1]);assert.equal(h.included,3);assert.equal(h.dx,.5);});
test('2D counts boundaries once and clips either coordinate',()=>{const h=D.histogram2D(particles([[-1,-1],[1,1],[0,0],[2,0],[0,2]]),0,2,1,1,2,2,1,1);assert.deepEqual([...h.bins],[1,0,0,2]);assert.equal(h.included,3);assert.equal(h.peak,2);});
test('display preparation preserves every particle coordinate',()=>{const p=particles(Array.from({length:1000},(_,i)=>[Math.sin(i)*.001,Math.cos(i)*.004])),before=p.slice();D.autoBins(p,0,D.extent(p,0));D.histogram1D(p,0,D.extent(p,0),160);D.histogram2D(p,0,2,5,5,256);assert.deepEqual(p,before);});
test('independent ranges resolve a narrow plane',()=>{const p=particles(Array.from({length:1000},(_,i)=>[(i-500)*1e-6,(i-500)*1e-4]));const rx=D.extent(p,0),ry=D.extent(p,2);assert.ok(ry/rx>99);const n=D.autoBins(p,0,rx);assert.ok(n>=32&&n<=512);assert.ok(2*rx/n<2*ry/80);});
test('manual fine bins retain separated peaks and empty gap',()=>{const p=particles(Array.from({length:1000},(_,i)=>[(i%2?1:-1)*.001,0]));const h=D.histogram1D(p,0,2,160);assert.equal(sum(h.bins),1000);assert.equal(h.bins.filter(x=>x>0).length,2);assert.equal(h.bins[80],0);});
test('automatic bins handle empty and degenerate samples',()=>{assert.equal(D.autoBins(new Float64Array(),0,1),32);assert.equal(D.autoBins(particles([[0,0],[0,0]]),0,1),128);assert.ok(D.extent(new Float64Array(),0)>0);});
test('fine image conserves all in-range counts',()=>{const p=particles(Array.from({length:50000},(_,i)=>[Math.sin(i)*.001,Math.cos(i)*.004]));for(const n of [128,256,512]){const h=D.histogram2D(p,0,2,5,5,n);assert.equal(sum(h.bins),50000);assert.equal(h.included,50000);}});
test('invalid bin and range inputs rejected',()=>{assert.throws(()=>D.histogram1D([],0,0,80));assert.throws(()=>D.histogram2D([],0,2,1,1,1.5));});
console.log(`${tests} diagnostics tests passed`);
