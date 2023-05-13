/*
Last Modified time : 20220211 15:38 by https://immmmm.com
已适配 FriendCircle 公共库和主库
*/
var fdatalist = JSON.parse(localStorage.getItem("fdatalist"));
//默认数据
var fcdata = {
  jsonurl: '',
  apiurl: '',
  apipublicurl: fdatalist.apiurl, //默认公共库
  initnumber: fdatalist.initnumber,  //首次加载文章数
  stepnumber: fdatalist.stepnumber,  //更多加载文章数
  article_sort: 'created', //文章排序 updated or created
  error_img: 'https://sdn.geekzu.org/avatar/57d8260dfb55501c37dde588e7c3852c'
}
//可通过 var fdataUser 替换默认值
if(typeof(fdataUser) !=="undefined"){
  for(var key in fdataUser) {
    if(fdataUser[key]){
      fdata[key] = fdataUser[key];
    }
  }
}
var article_num = '',sortNow='',UrlNow='',friends_num=''
var container = document.getElementById('fcircleContainer') || document.getElementById('af-container');
// 获取本地 排序值、加载apiUrl，实现记忆效果
var localSortNow = localStorage.getItem("sortNow")
var localUrlNow = localStorage.getItem("urlNow")
if(localSortNow && localUrlNow){
  sortNow = localSortNow
  UrlNow = localUrlNow
}else{
  sortNow = fcdata.article_sort
  if(fcdata.jsonurl){
    UrlNow = fcdata.apipublicurl+'postjson?jsonlink='+ fcdata.jsonurl+"&"
  }else if(fcdata.apiurl){
    UrlNow = fcdata.apiurl+'all?'
  }else{
    UrlNow = fcdata.apipublicurl+'all?'
  }
  console.log("当前模式："+UrlNow)
  localStorage.setItem("urlNow",UrlNow)
  localStorage.setItem("sortNow",sortNow)
}
// 打印基本信息
function loadStatistical(sdata){
  article_num = sdata.article_num
  friends_num = sdata.friends_num
  var messageBoard =`
  <div id="af-state" class="af-new-add">
    <div class="af-state-data">
      <div class="af-data-friends" onclick="openToShow()">
        <span class="af-label">订阅</span>
        <span class="af-message">${sdata.friends_num}</span>
      </div>
      <div class="af-data-active" onclick="changeEgg()">
        <span class="af-label">活跃</span>
        <span class="af-message">${sdata.active_num}</span>
      </div>
      <div class="af-data-article" onclick="clearLocal()">
        <span class="af-label">日志</span>
        <span class="af-message">${sdata.article_num}</span>
      </div>
    </div>
    <div id="af-change">
        <span id="af-change-created" data-sort="created" onclick="changeSort(event)" class="${sortNow == 'created' ? 'af-change-now':''}">Created</span> | <span id="af-change-updated" data-sort="updated" onclick="changeSort(event)" class="${sortNow == 'updated' ? 'af-change-now':''}" >Updated</span>
    </div>
  </div>
  `;
  var loadMoreBtn = `
    <div id="af-more" class="af-new-add" onclick="loadNextArticle()"><i class="fas fa-angle-double-down"></i></div>
    <div id="af-footer" class="af-new-add">
     <span id="af-version-up" onclick="checkVersion()"></span>
     <span class="af-data-lastupdated">更新于：${sdata.last_updated_time}</span>
     <span class="af-data-lastupdated">订阅:${sdata.friends_num} 活跃:${sdata.active_num} 日志:${sdata.article_num}</span>
    </div>
    <div id="af-overlay" class="af-new-add" onclick="closeShow()"></div>
    <div id="af-overshow" class="af-new-add"></div>
  `;
  if(container){
    // container.insertAdjacentHTML('beforebegin', messageBoard);
    container.insertAdjacentHTML('afterend', loadMoreBtn);
  }
}
// 打印文章内容 af-article
function loadArticleItem(datalist,start,end){
  var articleItem = '';
  var articleNum = article_num;
  var endFor = end
  if(end > articleNum){endFor = articleNum}
  if(start < articleNum){
    for (var i = start;i<endFor;i++){
      var item = datalist[i];
      articleItem +=`
      <div class="af-article">
        <a class="af-article-title" href="${item.link}" target="_blank" rel="noopener nofollow" data-title="${item.title}">${item.title}</a>
        <span class="af-article-floor">${item.floor}</span>
        <div class="af-article-avatar no-lightbox flink-item-icon">
          <a onclick="openMeShow(event)" data-link="${item.link}" class="" target="_blank" rel="noopener nofollow" href="javascript:;"><img class="af-img-avatar avatar" src="${item.avatar}" alt="avatar" onerror="this.src='${fcdata.error_img}'; this.onerror = null;"><span class="af-article-author">${item.author}</span></a>
          <span class="af-article-time">
            <span class="af-time-created" style="${sortNow == 'created' ? '':'display:none'}">${item.created}</span>
            <span class="af-time-updated" style="${sortNow == 'updated' ? '':'display:none'}"><i class="fas fa-history">更新于</i>${item.updated}</span>
          </span>
        </div>
      </div>
      `;
    }
    container.insertAdjacentHTML('beforeend', articleItem);
    // 预载下一页文章
    fetchNextArticle()
  }else{
    // 文章加载到底
    document.getElementById('af-more').outerHTML = `<div id="af-more" class="af-new-add" onclick="loadNoArticle()"><small>一切皆有尽头！</small></div>`
  }
}
// 打印个人卡片 af-overshow
function loadFcircleShow(userinfo,articledata){
  var showHtml = `
      <div class="af-overshow">
        <div class="af-overshow-head">
          <img class="af-img-avatar avatar" src="${userinfo.avatar}" alt="avatar" onerror="this.src='${fcdata.error_img}'; this.onerror = null;">
          <a class="" target="_blank" rel="noopener nofollow" href="${userinfo.link}">${userinfo.name}</a>
        </div>
        <div class="af-overshow-content">
  `
  for (var i = 0;i<userinfo.article_num;i++){
    var item = articledata[i];
    showHtml += `
      <p><a class="af-article-title"  href="${item.link}" target="_blank" rel="noopener nofollow" data-title="${item.title}">${item.title}</a><span>${item.created}</span></p>
    `
  }
  showHtml += '</div></div>'
  document.getElementById('af-overshow').insertAdjacentHTML('beforeend', showHtml);
  document.getElementById('af-overshow').className = 'af-show-now';
}

// // 预载下一页文章，存为本地数据 nextArticle
// function fetchNextArticle(){
//   var start = document.getElementsByClassName('af-article').length
//   var end = start + fcdata.stepnumber
//   var articleNum = article_num;
//   if(end > articleNum){
//     end = articleNum
//   }
//   if(start <  articleNum){
//     UrlNow = localStorage.getItem("urlNow")
//     var fetchUrl = UrlNow+"rule="+sortNow+"&start="+start+"&end="+end
//     //console.log(fetchUrl)
//     fetch(fetchUrl)
//       .then(res => res.json())
//       .then(json =>{
//         var nextArticle = eval(json.article_data);
//         console.log("已预载"+"?rule="+sortNow+"&start="+start+"&end="+end)
//         localStorage.setItem("nextArticle",JSON.stringify(nextArticle))
//     })
//   }else if(start = articleNum){
//       document.getElementById('af-more').outerHTML = `<div id="af-more" class="af-new-add" onclick="loadNoArticle()"><small>一切皆有尽头！</small></div>`
//   }
// }
// 显示下一页文章，从本地缓存 nextArticle 中获取
function loadNextArticle(){
  var nextArticle = JSON.parse(localStorage.getItem("nextArticle"));
  var articleItem = ""
    for (var i = 0;i<nextArticle.length;i++){
      var item = nextArticle[i];
      articleItem +=`
      <div class="af-article">
        <a class="af-article-title" href="${item.link}" target="_blank" rel="noopener nofollow" data-title="${item.title}">${item.title}</a>
        <span class="af-article-floor">${item.floor}</span>
        <div class="af-article-avatar no-lightbox flink-item-icon">
          <a onclick="openMeShow(event)" data-link="${item.link}" class="" target="_blank" rel="noopener nofollow" href="javascript:;"><img class="af-img-avatar avatar" src="${item.avatar}" alt="avatar" onerror="this.src='${fcdata.error_img}'; this.onerror = null;"><span class="af-article-author">${item.author}</span></a>
          <span class="af-article-time">
            <span class="af-time-created" style="${sortNow == 'created' ? '':'display:none'}">${item.created}</span>
            <span class="af-time-updated" style="${sortNow == 'updated' ? '':'display:none'}"><i class="fas fa-history">更新于</i>${item.updated}</span>
          </span>
        </div>
      </div>
      `;
    }
    container.insertAdjacentHTML('beforeend', articleItem);
    lazyLoadInstance.update();
    // 同时预载下一页文章
    fetchNextArticle()
}
// 没有更多文章
function loadNoArticle(){
  var articleSortData = sortNow+"ArticleData"
  localStorage.removeItem(articleSortData)
  localStorage.removeItem("statisticalData")
  //localStorage.removeItem("sortNow")
  document.getElementById('af-more').remove()
  window.scrollTo(0,document.getElementsByClassName('af-state').offsetTop)
}
// 清空本地数据
function clearLocal(){
  localStorage.removeItem("updatedArticleData")
  localStorage.removeItem("createdArticleData")
  localStorage.removeItem("nextArticle")
  localStorage.removeItem("statisticalData")
  localStorage.removeItem("sortNow")
  localStorage.removeItem("urlNow")
  location.reload();
}
//
function checkVersion(){
  var url = fcdata.apiurl+"version"
  fetch(url)
    .then(res => res.json())
    .then(json =>{
      console.log(json)
      var nowStatus = json.status,nowVersion = json.current_version,newVersion = json.latest_version
      var versionID = document.getElementById('af-version-up')
      if(nowStatus == 0){
        versionID.innerHTML = "当前版本：v"+ nowVersion
      }else if(nowStatus == 1){
        versionID.innerHTML = "发现新版本：v"+ nowVersion + " ↦ " + newVersion
      }else{
        versionID.innerHTML = "网络错误，检测失败！"
      }
  })
}
// 切换为公共全库
function changeEgg(){
  //有自定义json或api执行切换
  if(fcdata.jsonurl || fcdata.apiurl ){
    document.querySelectorAll('.af-new-add').forEach(el => el.remove());
    localStorage.removeItem("updatedArticleData")
    localStorage.removeItem("createdArticleData")
    localStorage.removeItem("nextArticle")
    localStorage.removeItem("statisticalData")
    container.innerHTML = ""
    UrlNow = localStorage.getItem("urlNow")
    //console.log("新"+UrlNow)
    var UrlNowPublic = fcdata.apipublicurl+'all?'
    if(UrlNow !== UrlNowPublic){ //非完整默认公开库
      changeUrl = fcdata.apipublicurl+'all?'
    }else{
      if(fcdata.jsonurl){
        changeUrl = fcdata.apipublicurl+'postjson?jsonlink='+ fcdata.jsonurl+"&"
      }else if(fcdata.apiurl){
        changeUrl = fcdata.apiurl+'all?'
      }
    }
    localStorage.setItem("urlNow",changeUrl)
    FetchFriendCircle(sortNow,changeUrl)
  }else{
    clearLocal()
  }
}
// 首次加载文章
function FetchFriendCircle(sortNow,changeUrl){
  var end = fcdata.initnumber
  var fetchUrl = UrlNow + "rule="+sortNow+"&start=0&end="+end
  if(changeUrl){
    fetchUrl = changeUrl + "rule="+sortNow+"&start=0&end="+end
  }
  //console.log(fetchUrl)
  fetch(fetchUrl)
    .then(res => res.json())
    .then(json =>{
      var statisticalData = json.statistical_data;
      var articleData = eval(json.article_data);
      var articleSortData = sortNow+"ArticleData";
      loadStatistical(statisticalData);
      loadArticleItem(articleData ,0,end)
      localStorage.setItem("statisticalData",JSON.stringify(statisticalData))
      localStorage.setItem(articleSortData,JSON.stringify(articleData))
    })
}
// 点击切换排序
function changeSort(event){
  sortNow = event.currentTarget.dataset.sort
  localStorage.setItem("sortNow",sortNow)
  document.querySelectorAll('.af-new-add').forEach(el => el.remove());
  container.innerHTML = "";
  changeUrl = localStorage.getItem("urlNow")
  //console.log(changeUrl)
  initFriendCircle(sortNow,changeUrl)
  if(fcdata.apiurl){
    checkVersion()
  }
}
//查询个人文章列表
function openMeShow(event){
  event.preventDefault()
  var parse_url = /^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
  var meLink = event.currentTarget.dataset.link.replace(parse_url, '$1:$2$3')
  console.log(meLink)
  var fetchUrl = ''
  if(fcdata.apiurl){
    fetchUrl = fcdata.apiurl + "post?link="+meLink
  }else{
    fetchUrl = fcdata.apipublicurl + "post?link="+meLink
  }
  //console.log(fetchUrl)
  if(noClick == 'ok'){
    noClick = 'no'
    fetchShow(fetchUrl)
  }
}
// 关闭 show
function closeShow(){
  document.getElementById('af-overlay').className -= 'af-show-now';
  document.getElementById('af-overshow').className -= 'af-show-now';
  document.getElementById('af-overshow').innerHTML = ''
}
// 点击开往
var noClick = 'ok';
function openToShow(){
  var fetchUrl = ''
  if(fcdata.apiurl){
    fetchUrl = fcdata.apiurl + "post"
  }else{
    fetchUrl = fcdata.apipublicurl + "post"
  }
  //console.log(fetchUrl)
  if(noClick == 'ok'){
    noClick = 'no'
    fetchShow(fetchUrl)
  }
}
// 展示个人文章列表
function fetchShow(url){
  var closeHtml = `
    <div class="af-overshow-close" onclick="closeShow()"></div>
  `
  document.getElementById('af-overlay').className = 'af-show-now';
  document.getElementById('af-overshow').insertAdjacentHTML('afterbegin', closeHtml);
  console.log("开往"+url)
  fetch(url)
    .then(res => res.json())
    .then(json =>{
      console.info(json)
      noClick = 'ok'
      var statisticalData = json.statistical_data;
      var articleData = eval(json.article_data);
      loadFcircleShow(statisticalData,articleData)
    })
}
// 初始化方法，如有本地数据首先调用
function initFriendCircle(sortNow,changeUrl){
  var articleSortData = sortNow+"ArticleData";
  var localStatisticalData = JSON.parse(localStorage.getItem("statisticalData"));
  var localArticleData = JSON.parse(localStorage.getItem(articleSortData));
  container.innerHTML = "";
  // if(localStatisticalData && localArticleData){
  //   loadStatistical(localStatisticalData);
  //   loadArticleItem(localArticleData ,0,fcdata.initnumber)
  //   console.log("本地数据加载成功")
  //   var fetchUrl = UrlNow + "rule="+sortNow+"&start=0&end="+fcdata.initnumber
  //   fetch(fetchUrl)
  //   .then(res => res.json())
  //   .then(json =>{
  //     var statisticalData = json.statistical_data;
  //     var articleData = eval(json.article_data);
  //     //获取文章总数与第一篇文章标题
  //     var localSnum = localStatisticalData.article_num
  //     var newSnum = statisticalData.article_num
  //     var localAtile = localArticleData[0].title
  //     var newAtile = articleData[0].title
  //     //判断文章总数或文章标题是否一致，否则热更新
  //     if(localSnum !== newSnum || localAtile !== newAtile){
  //       document.getElementById('af-state').remove()
  //       document.getElementById('af-more').remove()
  //       document.getElementById('af-footer').remove()
  //       container.innerHTML = "";
  //       var articleSortData = sortNow+"ArticleData";
  //       loadStatistical(statisticalData);
  //       loadArticleItem(articleData ,0,fcdata.initnumber)
  //       localStorage.setItem("statisticalData",JSON.stringify(statisticalData))
  //       localStorage.setItem(articleSortData,JSON.stringify(articleData))
  //       console.log("热更新完成")
  //     }else{
  //       console.log("API数据未更新")
  //     }
  //   })
  // }else{
    FetchFriendCircle(sortNow,changeUrl)
    // console.log("第一次加载完成")
  // }
}
// 执行初始化
initFriendCircle(sortNow)
