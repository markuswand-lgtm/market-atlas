// Firebase's write-size limit also applies to the data removed by a deletion.
// Remove old archives in the same bounded units used when uploading them.
async function clearChildren(ref) {
 for (;;) {
  const first=await ref.orderByKey().limitToFirst(1).get();
  if(!first.exists())return;
  let key;first.forEach(child=>{key=child.key;});
  if(!key)throw new Error('Cannot identify an archive child for cleanup.');
  await ref.child(key).remove();
 }
}

export async function publishManifest(database,manifest) {
 if(!/^[a-f0-9]{16}$/.test(manifest.snapshot))throw new Error('Invalid snapshot ID.');
 const history=(await database.ref('_publicationHistory').get()).val()||{};
 const previous=Object.entries(history).filter(([id])=>/^[a-f0-9]{16}$/.test(id)&&id!==manifest.snapshot)
  .sort((a,b)=>String(b[1]).localeCompare(String(a[1])));
 // Switch the pointer only after all new data is staged. Keep cleanup candidates
 // in the history until deletion succeeds, so interrupted cleanup is retried.
 await database.ref().update({manifest,_publicationHistory:{...history,[manifest.snapshot]:manifest.publishedAt}});
 for(const [id] of previous.slice(2)) {
  const snapshot=database.ref('snapshots/'+id);
  await clearChildren(snapshot.child('series'));
  await clearChildren(snapshot.child('sqlite/chunks'));
  await snapshot.remove(); // Only small metadata remains.
  await database.ref('_publicationHistory/'+id).remove();
 }
}
