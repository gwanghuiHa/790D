/* Named lecture presets. Student workspaces contain lattice settings only. */
(function(root){
'use strict';
const P=typeof module!=='undefined'?require('./physics.js'):root.Optics;
const copy=v=>JSON.parse(JSON.stringify(v));
function preset(value){
 if(!value||typeof value.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(value.id))throw Error('Invalid preset ID.');
 const name=String(value.name||'').trim();if(!name||name.length>60)throw Error('Preset names must contain 1–60 characters.');
 P.validateBeam(value.beam);P.validate(value.line,value.screen,value.extension);
 return {id:value.id,name,beam:copy(value.beam),line:value.line.map((e,i)=>({...copy(e),id:i+1})),screen:value.screen,extension:value.extension};
}
function normalize(experiment){
 if(experiment.format!=='790D-experiment'||experiment.version!==1)throw Error('Unsupported experiment format.');
 const items=experiment.presets===undefined?[{...experiment,id:'preset-1',name:'Preset 1'}]:experiment.presets;
 if(!Array.isArray(items)||!items.length||items.length>50)throw Error('Use between 1 and 50 presets.');
 const presets=items.map(preset),ids=new Set(),names=new Set();for(const p of presets){if(ids.has(p.id))throw Error('Preset IDs must be unique.');if(names.has(p.name.toLowerCase()))throw Error('Preset names must be unique.');ids.add(p.id);names.add(p.name.toLowerCase());}
 const defaultPresetId=experiment.defaultPresetId||presets[0].id;if(!ids.has(defaultPresetId))throw Error('Default preset does not exist.');return {presets,defaultPresetId};
}
function publication(experiment,catalog){const c=normalize({...experiment,...catalog}),p=c.presets.find(p=>p.id===c.defaultPresetId);return {...experiment,...c,beam:copy(p.beam),line:copy(p.line),screen:p.screen,extension:p.extension};}
function choose(catalog,id,workspace){const p=catalog.presets.find(p=>p.id===id);if(!p)throw Error('Preset does not exist.');const result=copy(p);if(workspace){try{P.validate(workspace.line,workspace.screen,workspace.extension);Object.assign(result,{line:copy(workspace.line),screen:workspace.screen,extension:workspace.extension});}catch{/* Invalid session lattice is replaced by the preset baseline. */}}return result;}
function restore(catalog,saved,revision){let activeId=catalog.defaultPresetId,workspaces={};if(saved?.defaultsRevision===revision){if(catalog.presets.some(p=>p.id===saved.activePresetId)){activeId=saved.activePresetId;for(const p of catalog.presets){const w=saved.presetWorkspaces?.[p.id];if(w)workspaces[p.id]=choose(catalog,p.id,w);}}else if(!saved.activePresetId&&Array.isArray(saved.line)){workspaces[activeId]={line:saved.line,screen:saved.screen,extension:saved.extension};}}
 // Strip beam and all other fields, even if a session file includes them.
 workspaces=Object.fromEntries(Object.entries(workspaces).map(([id,w])=>[id,{line:copy(w.line),screen:w.screen,extension:w.extension}]));return {activeId,workspaces};}
const api={preset,normalize,publication,choose,restore};if(typeof module!=='undefined')module.exports=api;else root.LecturePresets=api;
})(typeof globalThis!=='undefined'?globalThis:this);
