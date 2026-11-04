/* Shared defaults and GitHub publishing; no credential persistence. */
(function(root){
'use strict';
const endpoint='https://api.github.com/repos/gwanghuiHa/790D/contents/defaults.json';
function encode(text){const bytes=new TextEncoder().encode(text);return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));}
function decode(text){return new TextDecoder().decode(Uint8Array.from(atob(text.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
async function load(fetcher=fetch){const response=await fetcher('defaults.json?fresh='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('Published defaults could not be loaded (HTTP '+response.status+'). Reload to retry.');const data=await response.json();if(typeof data.revision!=='string'||!data.revision)throw Error('Published defaults have no revision.');return data;}
function restoreLattice(current,saved){
 // Never take beam or passcode from a student's session snapshot.
 const state=JSON.parse(JSON.stringify(current));
 if(saved&&saved.defaultsRevision===current.revision&&Array.isArray(saved.line))Object.assign(state,{line:saved.line,screen:saved.screen,extension:saved.extension});
 return state;
}
async function publish(experiment,token,expectedRevision,fetcher=fetch){
 if(!token||!token.trim())throw Error('Enter a GitHub token with Contents: read and write access to 790D.');
 const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+token.trim(),'X-GitHub-Api-Version':'2022-11-28'};
 const current=await fetcher(endpoint+'?ref=main&fresh='+Date.now(),{headers,cache:'no-store'});
 if(!current.ok)throw Error(current.status===401?'GitHub did not accept this token.':current.status===403?'GitHub denied access. Check the token’s repository selection, Contents permission and expiration.':'Could not read the current defaults (HTTP '+current.status+').');
 const file=await current.json(),remote=JSON.parse(decode(file.content));
 if(remote.revision!==expectedRevision)throw Error('The published defaults changed since this page loaded. Save your experiment, reload the page, then load your experiment and publish again.');
 const updated={...experiment,revision:globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2),publishedAt:new Date().toISOString()};
 const response=await fetcher(endpoint,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:'Update published PHYS 790D experiment defaults',branch:'main',sha:file.sha,content:encode(JSON.stringify(updated,null,2)+'\n')})});
 if(!response.ok)throw Error(response.status===409||response.status===422?'The defaults changed during publishing. Reload before trying again.':response.status===401||response.status===403?'GitHub denied publishing. Use a token for 790D with Contents: read and write permission.':'Publishing failed (HTTP '+response.status+'). The published defaults were not confirmed.');
 const result=await response.json();return {settings:updated,commit:result.commit?.sha};
}
const api={load,restoreLattice,publish,encode,decode};if(typeof module!=='undefined')module.exports=api;else root.SharedSettings=api;
})(typeof globalThis!=='undefined'?globalThis:this);
