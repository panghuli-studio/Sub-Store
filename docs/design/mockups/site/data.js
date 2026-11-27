export const files = [
 {id:'import',name:'itemImport',type:'local',detail:'detailImport'},
 {id:'stash',name:'itemCfgStash',type:'config',detail:'detailConfig',sourceType:'local',content:'mode: rule\nproxies: []\nproxy-groups: []\nrules: []'},
 {id:'stash-nodes',name:'itemNodesStash',type:'nodes',detail:'detailNodes'},
 {id:'clash-verge',name:'itemCfgClash',type:'config',detail:'detailConfig',sourceType:'local',content:'mode: rule\nproxies: []\nproxy-groups: []\nrules: []'},
 {id:'clash-verge-nodes',name:'itemNodesClash',type:'nodes',detail:'detailNodes'},
];
export const lists = {
 subs:[{id:'jms',name:'itemJms',type:'remote',detail:'subMetaA',url:'https://example.invalid/subscription'},{id:'bywave',name:'itemBywave',type:'local',detail:'subMetaB',content:'ss://example-node'},{id:'all',name:'itemAll',type:'collection',detail:'subMetaC',subscriptions:['JMS · 示例订阅','ByWave · 示例订阅']}],
 sync:[{id:'sync-a',name:'syncA',type:'remote',detail:'syncMeta'},{id:'sync-b',name:'syncB',type:'remote',detail:'syncMeta'}],
 shares:[{id:'share-a',name:'shareConfigA',type:'file',detail:'shareMeta'},{id:'share-b',name:'shareNodesA',type:'sub',detail:'shareMeta'},{id:'share-c',name:'shareConfigB',type:'file',detail:'shareMeta'},{id:'share-d',name:'shareNodesB',type:'col',detail:'shareMeta'}],
 archives:[{id:'archive-a',name:'archiveA',type:'file',detail:'archiveMeta'},{id:'archive-b',name:'archiveB',type:'sub',detail:'archiveMeta'},{id:'archive-col',name:'示例组合归档',type:'col',detail:'archiveMeta'},{id:'archive-artifact',name:'示例同步产物归档',type:'artifact',detail:'archiveMeta'},{id:'archive-share',name:'示例分享归档',type:'share',detail:'archiveMeta'}],
};
