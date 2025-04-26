/*
- Niconico Chat script for cytu.be
- https://github.com/deerfarce/cytube-nnd-chat
- version 1.035
- (still in testing, some things will NOT work as they should)
*/

(function() {

    let _defaultEnabled = true,
        _defaultFontSize = 32,
        _defaultImageHeight = 48,
        _scrollDuration = 7;

    let setFontSizeCSS = function(fontsize, imageheight) {
      $('.head-NNDCSS-fontsize').remove();
      $('<style />', {
          'class':'head-NNDCSS-fontsize',
          text:".videoText img, .videochatContainer .channel-emote {max-height: "+imageheight+"px!important;max-width: "+(imageheight*2)+"px!important;}"+
          ".videoText {font-size: "+fontsize+"px}"
      }).appendTo('head');
    }

    //remove previous NND CSS elements if they exist
    $('.head-NNDCSS').remove();
    $('.head-NNDCSS-opacity').remove();

    /*create CSS for messages and modal element, this will probably become an external sheet in the future
    - this is NOT meant to be a one-time thing, as it gets removed each time this script is run,
    - so it can be updated without making users refresh
    */
    $('<style />', {
        'class':'head-NNDCSS',
        text:".videoText {color: white;position: absolute;z-index: 1;cursor: default;white-space:nowrap;font-family: 'Meiryo', sans-serif;letter-spacing: 0.063em;user-select: none;text-shadow: 0 -0.063em #000, 0.063em 0 #000, 0 0.063em #000, -0.063em 0 #000;pointer-events: none}"+
            ".videoText.moving {transition: right "+_scrollDuration+"s linear, left "+_scrollDuration+"s linear}"+
            ".videoText.greentext {color: #789922}"+
            ".videoText img, .videochatContainer .channel-emote {box-shadow: none!important; vertical-align: top!important;display: inline-block!important;transition: none!important;}"+
            ".videoText.shout {color: #f00}"+
            ".modal .left-warning {float: left;padding: 10px 12px;font-size: 13px;color: #ff8f8f}"+
            ".modal .modal-caption {font-size: 13px;text-indent: 35px;color: #8f9cad}"+
            "#nndSettingsWrap .radio label {display: block;color: #c4ccd8}"+
            "#nndSettingsWrap #nnd-maxmsgs, #nndSettingsWrap #nnd-fontsize, #nndSettingsWrap #nnd-imageheight {margin: 10px 0;width: 100px;}"+
            ".modal-subheader {font-size: 16px;border-bottom: 1px solid #212123;margin-left: -10px;padding: 10px 0 0 2px}"+
            "#nndSettingsModal .subfooter {text-align: center;position: absolute;right: 0;left: 0;pointer-events: none;color: #757575;bottom: 12px;display: inline-block;}"+
            "#nndSettingsModal .subfooter .by {padding-right: 10px;border-right: 1px solid #252525;pointer-events: all;}"+
            "#nndSettingsModal .subfooter .ver {padding-left: 10px;border-left: 1px solid #4e4e4e}"+
            "#nndSettingsModal .radio, #nndSettingsModal .modal-option > input {margin-left: 35px!important;}"+
            "#nndSettingsModal .radio, #nndSettingsModal .checkbox, #nndSettingsModal .modal-option > input {margin-top: 4px!important;margin-bottom: 4px!important;}"+
            "#nnd-opacity-value {color: #8f9cad;}"+
            ".modal .modal-group {display: inline-block; margin-left: 35px;padding: 0 6px;border-radius: 4px;background: rgba(143, 156, 173, 0.15);}"+
            ".modal .modal-group > * {display: inline-block;text-indent: 0!important;}"+
            ".modal .modal-group > input {margin-left: 4px !important;}"
    }).appendTo('head');

    setFontSizeCSS(_defaultFontSize, _defaultImageHeight);

    console.debug('NND Chat: CSS added to page header');
    //on the other hand, we don't want this persistent stuff to run more than once..
    if (CLIENT.runNND) {
        console.error('NND Chat script attempted to load, but it looks like it has already been loaded!');
        return;
    }
    CLIENT.runNND = true;

    window.nnd = {
        'enabled':_defaultEnabled, //enabled? self-explanatory
        'MAX':125, //maximum amount of messages allowed on screen before the oldest messages are removed
        'offsetType':0, //0: position based on fontsize and player height; 1: random %
        'fromRight':true, //move messages from right? if false, moves from left instead
        'fontSize':_defaultFontSize, //font size of messages in pixels
        'imageHeight':_defaultImageHeight, //max height of images in pixels
        'displayImages':true, //show emotes/images in niconico messages
        'discardWhenFull':false,
        'opacity':70,
        '_fn': {
            'init':()=>{
              nnd['enabled'] = _defaultEnabled;
              nnd['MAX'] = 125;
              nnd['offsetType'] = 0;
              nnd['fromRight'] = true;
              nnd['fontSize'] = _defaultFontSize;
              nnd['imageHeight'] = _defaultImageHeight;
              nnd['displayImages'] = true;
              nnd['discardWhenFull'] = false;
              nnd['opacity'] = 70;
              nnd._fn.updateModal();
              nnd._fn.save()
            },
            'getopts':()=>{
              var tmp = {};
              for (var i in window.nnd)
                if (!(/^\_/).test(i))
                  tmp[i] = window.nnd[i];
              return tmp;
            },
            'save':()=>{
              if (!nnd.enabled) $('.videoText').remove();
              localStorage.setItem(CHANNEL.name.toLowerCase() + '_nndOptions', JSON.stringify(window.nnd._fn.getopts()));
            },
            'load':()=>{
              var tmp = JSON.parse(localStorage.getItem(CHANNEL.name.toLowerCase()+'_nndOptions'));

              if (tmp === null || tmp === undefined) {
                nnd._fn.init();
                console.debug('NND settings not found, using defaults and saving them');
                return;
              } else {
                for (var i in tmp) {
                  if (nnd.hasOwnProperty(i) && !(/^\_/).test(i))
                    nnd[i] = tmp[i];
                }
                nnd._fn.save();
                nnd._fn.updateModal();
              }
            },
            'updateModal':()=>{
              $('#nnd-enable').prop('checked', nnd.enabled);
              $('#nnd-displayimages').prop('checked', nnd.displayImages);
              $('#nnd-discardwhenfull').prop('checked', nnd.discardWhenFull);
              $('#nnd-opacity').val(nnd.opacity);
              $('#nnd-opacity-value').text(nnd.opacity + "%")
              $('#nnd-offsettype-' + nnd.offsetType).prop('checked', true);
              $('#nnd-fromright-' + nnd.fromRight).prop('checked', true);
              $('#nnd-maxmsgs').attr('placeholder', nnd.MAX);
              $('#nnd-maxmsgs').val(nnd.MAX)
              $('#nnd-fontsize').attr('placeholder', nnd.fontSize);
              $('#nnd-fontsize').val(nnd.fontSize);
              $('#nnd-imageheight').attr('placeholder', nnd.imageHeight);
              $('#nnd-imageheight').val(nnd.imageHeight);
              setFontSizeCSS(nnd.fontSize, nnd.imageHeight);
            },
            'saveFromModal':()=>{
              nnd['enabled'] = $('#nnd-enable').prop('checked');
              nnd['displayImages'] = $('#nnd-displayimages').prop('checked');

              if (!nnd['enabled'])
                $('.videoText').remove();

              nnd['discardWhenFull'] = $('#nnd-discardwhenfull').prop('checked');
              nnd['opacity'] = parseFloat($('#nnd-opacity').val());
              $('#nnd-opacity-value').text(nnd.opacity + "%");
              nnd._fn.setOpacity();

              if ($('#nnd-offsettype-0').prop('checked'))
                nnd['offsetType'] = 0;
              else if ($('#nnd-offsettype-1').prop('checked'))
                nnd['offsetType'] = 1;

              let oldFrom = nnd['fromRight'];
              nnd['fromRight'] = $('#nnd-fromright-true').prop('checked');
              if (nnd.fromRight !== oldFrom) $('.videoText').remove();

              nnd._fn.validateAndSetValue('MAX', $('#nnd-maxmsgs'), 1, 125);
              nnd._fn.validateAndSetValue('fontSize', $('#nnd-fontsize'), 1, _defaultFontSize);
              nnd._fn.validateAndSetValue('imageHeight', $('#nnd-imageheight'), 1, _defaultImageHeight);

              setFontSizeCSS(nnd.fontSize, nnd.imageHeight);

              nnd._fn.save();
            },
            'setOpacity':()=>{
              $('.head-NNDCSS-opacity').remove();
              $('<style />', {
                  'class':'head-NNDCSS-opacity',
                  text:".videoText {opacity:" + (nnd.opacity/100) + ";}"
              }).appendTo('head');
            },
            'placeMessage':(frm, el)=>{
              if (nnd.fontSize <= 0) nnd.fontSize = _defaultFontSize;
              let player = $('#ytapiplayer');
              let maxLane = (Math.floor(player.height() / nnd.fontSize)) - 1,
                  lane = 0,
                  playerWidth = player.width(),
                  thisWidth = el.width();

              if ($('.videoText').length <= 0) {

                if (nnd.offsetType === 1) {
                  lane = Math.floor(Math.random() * (maxLane + 1));
                }

              } else {

                let msgs = [];

                if (nnd.offsetType === 1) {//RANDOM

                  let openLanes = [];

                  for (;lane <= maxLane; lane++) {
                    msgs = $('.videoText[lane=' + lane + ']').last();
                    if (msgs.length <= 0 || !nnd._fn.willCollide(thisWidth, msgs, parseFloat(msgs.css(frm)), playerWidth)) {
                      openLanes.push(lane);
                      continue;
                    }
                  }

                  if (openLanes.length <= 0) {
                    if (nnd.discardWhenFull) {el.remove(); return;}
                    lane = Math.floor(Math.random() * (maxLane + 1));
                  } else {
                    lane = openLanes[Math.floor(Math.random() * openLanes.length)];
                  }

                } else {//ORDERED

                  let furthestLane = 0,
                    furthestLaneGap = 0,
                    allFull = false;

                  for (;lane <= maxLane; lane++) {
                    msgs = $('.videoText[lane=' + lane + ']').last();
                    if (msgs.length <= 0) break;
                    else {

                      let offset = parseFloat(msgs.css(frm));

                      if (!nnd._fn.willCollide(thisWidth, msgs, offset, playerWidth)) break;

                      if (furthestLaneGap >= 0 || offset > furthestLaneGap) {
                        furthestLane = lane;
                        furthestLaneGap = offset;
                      }
                      if (lane === maxLane) allFull = true;
                    }
                  }

                  if (allFull) {
                    if (nnd.discardWhenFull) {el.remove(); return;}
                    lane = furthestLane;
                  }

                }
              }

              el.css('top', (nnd.fontSize * lane) + 'px');
              el.attr('lane', lane);
              el.css(frm, (0 - thisWidth)+'px');
              el.addClass('moving');
              el.css('visibility', 'visible');
              el.css(frm, player.width()+'px');
            },
            'addScrollingMessage':(message, extraClass)=>{
              if (typeof window.nnd === "undefined") return;
              var opts = window.nnd;
              if (opts.MAX < 1 || isNaN(parseInt(opts.MAX))) opts.MAX = window.nnd.MAX = 125;
              if ($('.videoText').length >= opts.MAX && opts.MAX >= 1) return;
              if (opts.offsetType < 0 || opts.offsetType > 1) {
                  console.error('NNDchat: Unknown offsetType '+opts.offsetType+', reverting to 0');
                  window.nnd.offsetType = 0;
              }
              if (opts.enabled && $('#ytapiplayer')[0] && document.visibilityState === "visible") {
                  if (message !== null && typeof message === "string" && message.length > 0 && !(/^(?:\<.+?\>)?[\$\!]/.test(message))) {

                      var frm = 'right';
                      if (!opts.fromRight) frm = 'left';

                      var $txt = $('<div/>', {'class': 'videoText '+extraClass, style: 'visibility: hidden;'}).append(message);


                      var imgs = $txt.find("img"),
                        loadedImgs = 0;

                      if (!opts.displayImages) imgs.remove();
                      if ($txt.html().trim() === "") return;
                      $('.videochatContainer').append($txt);

                      if (imgs.length <= 0) {
                        opts._fn.placeMessage(frm, $txt);
                      } else {
                        imgs.on("load", function() {
                          loadedImgs++;
                          if (loadedImgs >= imgs.length) opts._fn.placeMessage(frm, $txt);
                        })
                      }

                  }
              } else return;
            },
            'willCollide':(nWidth, targetMsg, targetOffset, playerWidth)=>{
              let tWidth = targetMsg.width();
              if (nWidth <= tWidth) return targetOffset < 0;
              let delta = (playerWidth - targetOffset) / nnd._fn.getSpeed(tWidth, playerWidth);
              return (delta * nnd._fn.getSpeed(nWidth, playerWidth)) >= playerWidth;
            },
            'getSpeed':(elWidth, playerWidth)=>{
              return (playerWidth + elWidth) / _scrollDuration;
            },
            'validateAndSetValue':(valName, modalEl, min, _default)=>{
              if (!nnd.hasOwnProperty(valName)) {console.error("NND: tried to validate invalid property " + valName); return;}
              var value = parseFloat(modalEl.val());

              if (!isNaN(value) && value >= min) {
                nnd[valName] = value;
              } else {
                if (nnd[valName] < min) nnd[valName] = _default;
              }
              modalEl.attr('placeholder', nnd[valName]);
              modalEl.val(nnd[valName]);
            }
        },
        '_ver':'1.035'
    };

    //init: sets the window's nnd options to their defaults, then calls _fn.updateModal and _fn.save
    //getopts: returns the window's current nnd object excluding any of its keys beginning with "_"
    //save: stores the return value of getopts as a JSON string in localStorage, in an item named "X_nndOptions" where X is CHANNEL.name
    //load: attempts to grab [CHANNEL.name]_nndOptions from localStorage and replaces the current window's nnd options with them. finally, calls _fn.save then _fn.updateModal. only replaces properties that are found within the current nnd object, excludes keys beginning with "_". calls _fn.init if the localStorage settings are empty or null.
    //updateModal: updates the modal window elements to reflect the current nnd options.
    //saveFromModal: sets the current window's nnd object properties based on the options selected in the modal window, and calls _fn.save

    //create modal element, insert before #pmbar
    $('<div class="fade modal"id=nndSettingsModal aria-hidden=true role=dialog style=display:none tabindex=-1><div class=modal-dialog><div class=modal-content><div class=modal-header><button class=close data-dismiss=modal aria-hidden=true>×</button><h4>Niconico Chat Settings [<span id=modal-nnd-roomname>'+CHANNEL.name+'</span>]</h4></div><div class=modal-body id=nndSettingsWrap><div class=modal-option><div class=checkbox><label for=nnd-enable><input id=nnd-enable type=checkbox> Enable Niconico Chat</label><div class=modal-caption>Enable Niconico-style chat messages. Places chat messages on the currently playing video and scrolls them to the opposite side.</div></div></div><div class=modal-option><div class=checkbox><label for=nnd-displayimages><input id=nnd-displayimages type=checkbox> Display Images and Emotes</label><div class=modal-caption>Show images in Niconico messages.</div></div></div><div class="modal-option"><div class="checkbox"><label for="nnd-discardwhenfull"><input id="nnd-discardwhenfull" type="checkbox"> Discard New Messages When Full</label><div class="modal-caption">If checked, new messages will be ignored if there\'s no room for them. Otherwise, when there\'s no room, it will essentially be placed on a random line regardless of overlaps.</div></div></div><div class="modal-option"><div class="slider"><label for="nnd-opacity"> Opacity <span id="nnd-opacity-value">70%</span><input id="nnd-opacity" min="0" max="100" type="range"></label><div class="modal-caption">Controls transparency of messages. Default 70%.</div></div></div><div class=modal-option><div class=modal-subheader> Message Order</div><div class=modal-caption>Determines the order in which new messages are placed, as long as there is enough room.</div><div class=radio><label for=nnd-offsettype-0><input id=nnd-offsettype-0 type=radio name=offsettype> Top to Bottom whenever possible</label><br><label for=nnd-offsettype-1><input id=nnd-offsettype-1 type=radio name=offsettype> Random</label></div></div><div class=modal-option><div class=modal-subheader>Message Direction</div><div class=modal-caption>Determines where new messages will start and end.</div><div class=radio><label for=nnd-fromright-true><input id=nnd-fromright-true type=radio name=fromright> from Right to Left</label><br><label for=nnd-fromright-false><input id=nnd-fromright-false type=radio name=fromright> from Left to Right</label></div></div><div class=modal-option><div class=modal-subheader>Maximum Messages</div><div class=modal-caption>Maximum amount of messages allowed on screen at once. New messages will be ignored if this many are on screen. A large amount of messages may cause lag. Default 125.</div><input id=nnd-maxmsgs type=text class=form-control placeholder=125></div><div class="modal-option"><div class="modal-subheader">Message Size</div><div class="modal-caption">Sizes of all text and images in Niconico messages. Max image width is always twice the max image height. If you want to avoid vertical image overlap, make sure Max Image Height is the same as or less than Font Size.</div><div class="modal-group"><div class="modal-caption">Font Size (px, default '+_defaultFontSize+') </div><input id="nnd-fontsize" type="text" class="form-control" placeholder="'+_defaultFontSize+'"></div><div class="modal-group"><div class="modal-caption">Max Image Height (px, default '+_defaultImageHeight+')</div><input id="nnd-imageheight" type="text" class="form-control" placeholder="'+_defaultImageHeight+'"></div></div></div><div class=modal-footer><div class=left-warning>Settings are not applied until you click Save.</div><button class="btn btn-primary"data-dismiss=modal type=button onclick=nnd._fn.saveFromModal()>Save</button> <button class="btn btn-primary"data-dismiss=modal type=button onclick=nnd._fn.updateModal()>Close</button><div class="subfooter"><a class="by" href="https://github.com/deerfarce/cytube-nnd-chat" target="_blank" rel="noreferrer noopener">github</a><span class="ver">version '+nnd._ver+'</span></div></div></div></div></div>').insertBefore('#pmbar');

    //load the user's options then update the modal element
    nnd._fn.load();
    nnd._fn.updateModal();
    nnd._fn.setOpacity();

    $('#nnd-opacity').on("change", function(e) {
        $('#nnd-opacity-value').text(e.target.value + "%")
    })

    //create the button in #leftcontrols or in the navbar. toggles the NND Chat modal window when clicked
    if ($("#toggleNND").length <= 0) {
      if (window.cytubeEnhanced) {
        $('<li/>').append($('<a/>',{href:'#',id:'toggleNND',text:'NND settings',click:(t)=>{t.preventDefault();t.stopPropagation();$('#nndSettingsModal').modal();}})).insertAfter($("#" + window.cytubeEnhanced.prefix + "ui").parent());
      } else {
        $('#leftcontrols').append($('<button/>',{id:'toggleNND','class':'btn btn-default btn-sm',html:'<span class="glyphicon glyphicon-cog"></span> NND Chat Settings',click:()=>$('#nndSettingsModal').modal()}));
      }
    }


    //create .videochatContainer which is basically an invisible container element. this holds the chat messages that will be scrolling by
    $('.embed-responsive').prepend($('<div/>', {
        'class': 'videochatContainer'
    }));

    //once the message reaches the end of its CSS transition, remove it.
    //attached to #main just in case something happens with the container
    $('#main').on('transitionend', '.videochatContainer .videoText', function() {$(this).remove()});

    //attach addScrollingMessage to the chatMsg socket event
    //ignore messages sent by [server], [voteskip] and anything within CHANNEL.bots if defined
    socket.on('chatMsg', function(data) {
        if (IGNORED.indexOf(data.username) > -1) return;
        if (window.nnd.enabled &&
            ((data.meta && !data.meta.action) || !data.meta) &&
            data.time >= Date.now() - 2000 &&
            data.username.toLowerCase() !== '[server]' &&
            data.username.toLowerCase() !== '[voteskip]' &&
            (!CHANNEL.hasOwnProperty("bots") || (Array.isArray(CHANNEL.bots) && !~CHANNEL.bots.indexOf(data.username)))) {
            if (!data.meta['addClass'])
                data.meta['addClass'] = '';
            window.nnd._fn.addScrollingMessage(data.msg, data.meta.addClass);
        }
    });

    //save user's settings on page unload so they are persistent
    $(window).unload(function() {window.nnd._fn.save()});

    $(document).on("visibilitychange", function() {
      if (document.visibilityState !== "visible") {
        $('.videoText').remove();
      }
    });

    setTimeout(function() {
      let staleMessages = $('.videoText');
      if (staleMessages.length > 0) {
        setTimeout(function() {
          staleMessages.each(function(i,e) {e.remove()});
        }, 7500);
      }
    }, 2500);

    console.log('LOADED: Niconico chat script for cytu.be [https://github.com/deerfarce/cytube-nnd-chat]. Version '+nnd._ver);

})();
