var start = (start === undefined) ? "": start; 
var end = (end === undefined) ? "": end; 
//startdate="2019-03-01";
//enddate="2019-03-31";

const importer = {
  url: (url) => {
    return new Promise((resolve, reject) => {
      let script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      script.addEventListener('load', () => resolve(script), false);
      script.addEventListener('error', () => reject(script), false);
      document.body.appendChild(script);
    });
  },
  urls: (urls) => {
    return Promise.all(urls.map(importer.url));
  }
};

function loadstyle(cssurl){
  let link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', cssurl);
  document.head.appendChild(link);
}

// input: tlsinfo: [{ver: "Protocol", colspan: 0}, {ver:"TLSv1", colspan: 4}, {ver:"TLSv1.1", colspan:2}...]
// input: index: stating with 0, index of cipher cols
function getTLSver(tlsinfo, index){
  let offset = 0;
  for(v of tlsinfo){
    offset += v.colspan;
    //console.log("offset: "+ offset);
    //console.log("v.colspan: "+ v.colspan);
    if(index < offset){
      return v.ver;
    }
  }
}

// selector: to th e.g. 'tbody tr:eq(1) th'
// return tlsinfo: [{ver:"TLSv1", colspan: 4}, {ver:"TLSv1.1", colspan:2}...]
function parseTLSver(selector){
  let tlsinfo=[];
  $(selector).each( function(index){
    let _colspan=1;
    if ( $(this).attr('colspan') ){
      _colspan= parseInt( $(this).attr('colspan') );
    }
    let v = { ver: `${$(this).text()}`, colspan: _colspan};
    tlsinfo.push(v);
  });
  return tlsinfo;
}


//selector: to th e.g. 'tbody tr:eq(2) th'
//return labels: []
function parseCipher(selector){
  let labels=[];
  $(selector).each( function(index){
    //console.log(`${index} => ${$(this).text()}`);
    labels.push($(this).text());
  });
  return labels;
}


// selector: to TR like 'tbody tr:gt(2)'
// rawframe = [[20180101, 20180102, ..], [96,324,...], ..]
function parseRawFrame(selector){
  let rawframe=[];

  let n_cols = $(selector).first().children('td').length;
  for(let i=0; i<n_cols; i++){
    rawframe.push([]);
  }

  $(selector).each(function(i_row, rows){
    $(rows).children('td').each(function(i_col, cols){
      let dat = 0;
      //date col
      if( i_col == 0 ){
        dat = $(cols).text();
      }
      else{
        dat = parseInt( $(cols).text() );
        if(isNaN(dat)){
          dat = 0;
        }
      }
      rawframe[i_col].push(dat);
    });
  });
  return rawframe;
}

//return all traffic count included in dataframe
function getAllCount(dataframe){
  return dataframe[ dataframe.length - 1 ][ dataframe[dataframe.length - 1].length -1 ];
}

function getSumArray(array){
  let sum=0;
  for( let i of array){
    sum+=i;
  }
  return sum;
}

function getAllCountFromCTable(ctable){
  //pass
}

//labels = ["Cipher", "AES128 SHA", "AES256 SHA"...]

// rawframe = [[20180101, 20180102, ..], [96,324,...], ..]
// cdata <= rawframe * labels
// ctable <= data * tlsver

//dates = ["20180101", "20180102", ...]
//cdata = {label: "SHA128", data: [1, 23, 31, ...], sum: 1234, per: 0.124 }

//ctable = [{tlsver: "TLSv1.1", stat: [cdata1, cdata2, ...]}, sum: 1234, per: 0.43]
//===> ctable = { "TLSv1.1" : {stat: [cdata1, cdata2, ..], sum:1234, per:0.4}, "Date":["2019-03-01",..] }


// startdate: "2019-03-15"
// return: index to the correponding date, or 0 if not applicable
function getDurationIndex(rawframe, startdate, enddate){

  let _start_index;
  if (startdate === undefined){
    _start_index=0;
  }
  else{
    _start_index = rawframe[0].indexOf(startdate);
    if(_start_index == -1){
      _start_index = 0;
    }
  }

  let _end_index
  if(enddate === undefined){
    _end_index = rawframe[0].length - 1;
  }
  else{
    _end_index = rawframe[0].indexOf(enddate);
    if( _end_index == -1){
      _end_index = rawframe[0].length - 1 - 1;
    }
  }
  return {start_index: _start_index, end_index: _end_index};
}



//index: index of label: ex) index=1 => "AES128 SHA"
//retur cdate 
function genCData(rawframe, labels, index, startdate, enddate){
  let cdata={};
  let dur = getDurationIndex(rawframe, startdate, enddate);
  cdata.label = labels[index];
  cdata.data = rawframe[index].slice(dur.start_index, dur.end_index + 1);
  
  //skip if "Cipher" label's col
  if(index != 0){
    cdata.sum = getSumArray(cdata.data);
    //cdata.per = cdata.sum / getAllCount(rawframe);
    cdata.per = 0.0;
  }
  return cdata;
}

// input: array list of cdata
function getSumPer(cdata_list){
  let _sum=0;
  let _per=0;
  for(let i in cdata_list){
    _sum+=cdata_list[i].sum;
    _per+=cdata_list[i].per;
  }
  return {sum: _sum, per: _per};
}

function genCTable(rawframe, labels, tlsinfo, startdate, enddate){
  let ctable={};
  for(let v of tlsinfo){
    if(v.ver.includes("TLSv")){
      let d ={};
      d.stat = [];
      d.sum = 0;
      d.per = 0;
      ctable[v.ver] = d;
    }
  }

  // date label
  ctable["Date"] = genCData(rawframe, labels, 0, startdate, enddate);

  //to make cdata per Cipher and append to ctable
  for(let i=0; i < labels.length; i++){
    let ver = getTLSver(tlsinfo, i);
    if(ver.includes('TLSv')){
      let cdata = genCData(rawframe, labels, i, startdate, enddate);
      ctable[ver].stat.push(cdata);
    }
  }

  //calc all count and per in each cdata
  let allcount = 0;
  for(let k in ctable){
    for(i in ctable[k].stat){
      allcount += ctable[k].stat[i].sum;
    }
  }
  for(let k in ctable){
    for(i in ctable[k].stat){
      ctable[k].stat[i].per = ctable[k].stat[i].sum/allcount;;
    }
  }

  //calc sum and per
  for(let k in ctable){
    let d=ctable[k];
    let sumper=getSumPer(d.stat);
    d.sum = sumper.sum;
    d.per = sumper.per;
  }
  return ctable;
}

let _g = {};

// tag: 'th' or 'tr'
// innertxt: content text
// parentnode: document.Element('tr')
// return 
function appendRaw(tag, innertxt, parentnode, rowspan){
  let r = document.createElement(tag);
  if(rowspan != undefined){
    r.setAttribute('rowspan', rowspan);
  }
  let txt =  document.createTextNode(innertxt);
  r.appendChild(txt);
  parentnode.appendChild(r);
}

// input ctable
//return table element
function makeTable(ctable){
  let tbl = document.createElement('table');
  tbl.setAttribute('class', 'table table-hover table-sm');
  let thead = document.createElement('thead');
  thead.setAttribute('class', 'thead-dark')
  let tbody = document.createElement('tbody');
  let tr;

  //title
  tr = document.createElement('tr');
  appendRaw('th', 'Protocol', tr);
  appendRaw('th', 'Cipher', tr);
  appendRaw('th', 'Percentage', tr);
  appendRaw('th', 'Percentage', tr);
  thead.appendChild(tr);
  tbl.append(thead);

  //data
  let _done=[];
  for(let k in ctable){
    for(let i in ctable[k].stat){
      //let _cdata = ctable[k].stat[i];
      
      tr = document.createElement('tr');
      if(! _done.includes(k) ){
        rowspan=ctable[k].stat.length;
        appendRaw('td', k, tr, rowspan);
        appendRaw('td', ctable[k].stat[i].label, tr);
        appendRaw('td', (ctable[k].stat[i].per * 100).toFixed(2), tr);
        appendRaw('td', (ctable[k].per * 100).toFixed(2), tr, rowspan);
        _done.push(k);
      }
      else{
        appendRaw('td', ctable[k].stat[i].label, tr);
        appendRaw('td', (ctable[k].stat[i].per * 100).toFixed(2), tr);
      }
      tbody.appendChild(tr)
    }
  }
  tbl.append(tbody);
  return tbl;

}

function makeDurationLabel(ctable){
  let d = document.createElement('div');
  //let innertxt = `<b>Date:</b> from ${ctable.Date.data[0]} to ${ctable.Date.data[ ctable.Date.data.length -1 ]} `;
  //let txt = document.createTextNode(innertxt);
  //d.appendChild(txt);
  d.innerHTML=`<b>Date:</b> from ${ctable.Date.data[0]} to ${ctable.Date.data[ ctable.Date.data.length -1 ]} `;
  return d;
}


importer.urls([
  'https://code.jquery.com/jquery-3.3.1.slim.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js'
]).then(()=>{

  console.log('Hello!!');

  // load CSS
  loadstyle('https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css');

  //get TLS version
  let tlsinfo = parseTLSver('tbody tr:eq(1) th');
  console.log(tlsinfo);
  _g.tlsinfo = tlsinfo;


  let labels = parseCipher('tbody tr:eq(2) th');
  console.log(labels);
  _g.labels = labels;

  let rawframe = parseRawFrame('tbody tr:gt(2)');
  console.log(rawframe);
  _g.rawframe=rawframe;



  let ctable = genCTable(rawframe, labels, tlsinfo, start, end);
  _g.ctable=ctable;

  $('body').append('<hr>');
  tbl = makeTable(ctable);

  let div_inner=document.createElement('div');
  div_inner.appendChild(tbl);

  let div_outer=document.createElement('div');
  div_outer.setAttribute('class', 'container');
  
  let dur=makeDurationLabel(ctable);
  div_outer.appendChild(dur);
    
  div_outer.appendChild(div_inner);
  $('body').append(div_outer);


  $('body').append('<hr>');

});
