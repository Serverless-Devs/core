import { unzip } from '../../../src';

unzip('./dist.zip', './test', {filename: 'core.zip'}).then(()=>{
    console.log('done');
    
})