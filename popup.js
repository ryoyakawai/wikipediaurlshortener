/**
 * Copyright 2018 Ryoya Kawai
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

(async function(){
    const API_ENDPOINT = 'https://%%LANG%%.wikipedia.org/w/api.php';
    const SHORT_URL = 'https://%%LANG%%.wikipedia.org/?curid=%%PAGEID%%';

    let shortURL = null;
    let mainArea = document.querySelector('#main');
    let shortURLText = document.querySelector('#shorturltext');
    let copyButton = document.querySelector('#href');
    copyButton.addEventListener('mousedown', event => {
        event.target.classList.add('clicked');
        let copyURL = event.target.previousSibling.innerHTML;
        copyToClipboard(copyURL);
        setTimeout( _ => { event.target.classList.remove('clicked'); }, 1000);
    });
    
    const copyToClipboard = str => {
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    };

    const tabURL = await getTabURL();
    let errorFl = false;
    if(tabURL.match(/wikipedia.org\/\?curid/)=== null) {
        let subDomain = tabURL.split('//').pop();
        subDomain = ((subDomain.split('/').shift()).split('.')).shift();
        let title = tabURL.split('/').pop();
        if(title.match(/#/) !== null) {
            title = title.replace(/#.*/, '');
        }
        if(title != '') {
            const info = await getInfo(subDomain, title);
            
            try {
                let infoObj = JSON.parse(info);
                const pageid = infoObj.query.pages[0].pageid;
                shortURL = SHORT_URL.replace(/%%PAGEID%%/, pageid).replace(/%%LANG%%/, subDomain);        
            } catch(e) {
                errorFl = true;
            }
        } else {
            shortURL = tabURL.replace(/\/$/, '');
        }
    } else {
        shortURL = tabURL;
    }

    if(errorFl == false) {
        shortURLText.innerHTML = shortURL;
    } else {
        document.body.innerHTML = 'Something went wrong... Sorry.';
        document.body.style.setProperty('color', '#ff0000');
    }
    mainArea.style.setProperty('opacity', '1');

    async function getTabURL() {
        return  new Promise( (resolve, reject) => {
            try {
                chrome.tabs.query({currentWindow: true, active: true}, tab => {
                    resolve(tab[0].url);
                });
            } catch(e) {
                reject(new Error(e));
            }
        });
    };

    async function _fetchData(url) {
        const header = {method: 'post'};
        const data = await fetch(url);
        return data.text();
    }
    
    async function getInfo(subDomain, title) {
        let param = 'action=query&titles=%%TITLE%%&prop=revisions&rvprop=content&format=json&formatversion=2';
        param = param.replace(/%%TITLE%%/, title);
        let reqURL = API_ENDPOINT + '?' + param;
        reqURL = reqURL.replace(/%%LANG%%/, subDomain);
        let data = await _fetchData(reqURL);
        return data;
    }
}());

