/*
- NND Chat script for cytu.be
- https://github.com/deerfarce/cytube-nnd-chat
- version 1.022
- (still in testing, some things will NOT work as they should)
*/

(function() {
    
    let setFontSizeCSS = function(fontsize) {
      $('.head-NNDCSS-fontsize').remove();
      $('<style />', {
          'class':'head-NNDCSS-fontsize',
          text:".videoText img, .videochatContainer .channel-emote {max-height: "+((fontsize/16)*2)+"em!important;max-width: "+((fontsize/16)*4)+"em!important;}"+
          ".videoText {font-size: "+(fontsize/16)+"em}"
      }).appendTo('head');
    }
    
    //remove previous NND CSS elements if they exist
    $('.head-NNDCSS').remove();
    
    /*create CSS for messages and modal element, this will probably become an external sheet in the future
    - this is NOT meant to be a one-time thing, as it gets removed each time this script is run,
    - so it can be updated without making users refresh
    */
    $('<style />', {
        'class':'head-NNDCSS',
        text:".videoText {color: white;position: absolute;z-index: 1;cursor: default;white-space:nowrap;opacity:0.7;font-family: 'Meiryo', sans-serif;letter-spacing: 0.063em;user-select: none;text-shadow: 0 -0.063em #000, 0.063em 0 #000, 0 0.063em #000, -0.063em 0 #000;pointer-events: none}"+
            ".videoText.moving {transition: right 7.5s linear, left 7.5s linear}"+
            ".videoText.greentext {color: #789922}"+
            ".videoText img, .videochatContainer .channel-emote {vertical-align: middle!important;display: inline-block!important;transition: none!important;}"+
            ".videoText.shout {color: #f00}"+
            ".modal .left-warning {float: left;padding: 10px 12px;font-size: 13px;color: #ff8f8f}"+
            ".modal .modal-caption {font-size: 13px;text-indent: 35px;color: #8f9cad}"+
            "#nndSettingsWrap .radio label {display: block;color: #c4ccd8}"+
            "#nndSettingsWrap #nnd-maxmsgs, #nndSettingsWrap #nnd-fontsize {margin: 10px 0;width: 25%;min-width: 200px}"+
            ".modal-subheader {font-size: 16px;border-bottom: 1px solid #212123;margin-left: -10px;padding: 10px 0 0 2px}"+
            "#nndSettingsModal .subfooter {text-align: center;color: #757575;margin-top: 4px;}"+
            "#nndSettingsModal .subfooter .by {padding-right: 10px;border-right: 1px solid #252525}"+
            "#nndSettingsModal .subfooter .ver {padding-left: 10px;border-left: 1px solid #4e4e4e}"
    }).appendTo('head');
    
    setFontSizeCSS(32);
    
    console.debug('NND Chat: CSS added to page header');
    //on the other hand, we don't want this persistent stuff to run more than once..
    if (CLIENT.runNND) {
        console.error('NND Chat script attempted to load, but it looks like it has already been loaded!');
        return;
    }
    CLIENT.runNND = true;
        
    window.nnd = {
        'enabled':false, //enabled? self-explanatory
        'MAX':100, //maximum amount of messages allowed on screen before the oldest messages are removed
        'offsetType':0, //0: position based on fontsize and player height; 1: random %
        'fromRight':true, //move messages from right? if false, moves from left instead
        'fontSize':32, //font size of messages in pixels
        '_fn': {
            'init':()=>{
              nnd['enabled'] = false;
              nnd['MAX'] = 100;
              nnd['offsetType'] = 0;
              nnd['fromRight'] = true;
              nnd['fontSize'] = 32;
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
            'save':()=>
              localStorage.setItem(CHANNEL.name + '_nndOptions', JSON.stringify(window.nnd._fn.getopts())),
            'load':()=>{
              var tmp = JSON.parse(localStorage.getItem(CHANNEL.name+'_nndOptions'));
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
              $('#nnd-offsettype-' + nnd.offsetType).prop('checked', true);
              $('#nnd-fromright-' + nnd.fromRight).prop('checked', true);
              $('#nnd-maxmsgs').attr('placeholder', nnd.MAX);
              $('#nnd-maxmsgs').val(nnd.MAX)
              $('#nnd-fontsize').attr('placeholder', nnd.fontSize);
              $('#nnd-fontsize').val(nnd.fontSize);
              setFontSizeCSS(nnd.fontSize);
            },
            'saveFromModal':()=>{
              nnd['enabled'] = $('#nnd-enable').prop('checked');
              if (!nnd['enabled'])
                $('.videoText').remove();
              
              if ($('#nnd-offsettype-0').prop('checked'))
                nnd['offsetType'] = 0;
              else if ($('#nnd-offsettype-1').prop('checked'))
                nnd['offsetType'] = 1;
              
              nnd['fromRight'] = $('#nnd-fromright-true').prop('checked');
              
              var maxmsgs = parseInt($('#nnd-maxmsgs').val());
              
              if (!isNaN(maxmsgs) && maxmsgs >= 1) {
                nnd['MAX'] = maxmsgs;
                $('#nnd-maxmsgs').attr('placeholder', maxmsgs);
                $('#nnd-maxmsgs').val(maxmsgs)
              } else {
                $('#nnd-maxmsgs').val(nnd['MAX']);
                $('#nnd-maxmsgs').attr('placeholder', nnd['MAX']);
              }
              
              var fontsize = parseFloat($('#nnd-fontsize').val());
              
              if (!isNaN(fontsize) && fontsize > 0) {
                nnd['fontSize'] = fontsize;
                $('#nnd-fontsize').attr('placeholder', fontsize);
                $('#nnd-fontsize').val(fontsize)
              } else {
                $('#nnd-fontsize').val(nnd['fontSize']);
                $('#nnd-fontsize').attr('placeholder', nnd['fontSize']);
              }
              
              setFontSizeCSS(nnd.fontSize);
              
              nnd._fn.save();
            }
        },
        '_ver':'1.022'
    };

    //init: sets the window's nnd options to their defaults, then calls _fn.updateModal and _fn.save
    //getopts: returns the window's current nnd object excluding any of its keys beginning with "_"
    //save: stores the return value of getopts as a JSON string in localStorage, in an item named "X_nndOptions" where X is CHANNEL.name
    //load: attempts to grab [CHANNEL.name]_nndOptions from localStorage and replaces the current window's nnd options with them. finally, calls _fn.save then _fn.updateModal. only replaces properties that are found within the current nnd object, excludes keys beginning with "_". calls _fn.init if the localStorage settings are empty or null.
    //updateModal: updates the modal window elements to reflect the current nnd options.
    //saveFromModal: sets the current window's nnd object properties based on the options selected in the modal window, and calls _fn.save

    //create modal element, insert before #pmbar
    $('<div class="fade modal"id=nndSettingsModal aria-hidden=true role=dialog style=display:none tabindex=-1><div class=modal-dialog><div class=modal-content><div class=modal-header><button class=close data-dismiss=modal aria-hidden=true>×</button><h4>NND Chat Settings: <span id=modal-nnd-roomname>'+CHANNEL.name+'</span></h4></div><div class=modal-body id=nndSettingsWrap><div class=modal-option><div class=checkbox><label for=nnd-enable><input id=nnd-enable type=checkbox> Enable NND Chat</label><div class=modal-caption>Enable Nico Nico Douga-style chat messages. Places chat messages on the currently playing video and scrolls them to the opposite side.</div></div></div><div class=modal-option><div class=modal-subheader>Message Offset</div><div class=modal-caption>Determines how the position of the chat message is generated.</div><div class=radio><label for=nnd-offsettype-0><input id=nnd-offsettype-0 type=radio name=offsettype> Random position based on font size of message and video player height</label><br><label for=nnd-offsettype-1><input id=nnd-offsettype-1 type=radio name=offsettype> Random percent from top of video player</label></div></div><div class=modal-option><div class=modal-subheader>Message Direction</div><div class=modal-caption>Determines where new messages will start and end.</div><div class=radio><label for=nnd-fromright-true><input id=nnd-fromright-true type=radio name=fromright> from Right to Left</label><br><label for=nnd-fromright-false><input id=nnd-fromright-false type=radio name=fromright> from Left to Right</label></div></div><div class=modal-option><div class=modal-subheader>Maximum Messages</div><div class=modal-caption>Maximum amount of messages allowed on screen at once. New messages will be ignored if this many are on screen. A large amount of messages may cause lag. Default 100.</div><input id=nnd-maxmsgs type=text class=form-control placeholder=100></div><div class="modal-option"><div class="modal-subheader">Font Size</div><div class="modal-caption">Font size of all NND messages in pixels. Default 32.</div><input id="nnd-fontsize" type="text" class="form-control" placeholder="32"></div></div><div class=modal-footer><div class=left-warning>Settings are not applied until you click Save.</div><button class="btn btn-primary"data-dismiss=modal type=button onclick=nnd._fn.saveFromModal()>Save</button> <button class="btn btn-primary"data-dismiss=modal type=button onclick=nnd._fn.updateModal()>Close</button><div class="subfooter"><a class="by" href="https://github.com/deerfarce/cytube-nnd-chat" target="_blank" rel="noreferrer noopener">github</a><span class="ver">version '+nnd._ver+'</span></div></div></div></div></div>').insertBefore('#pmbar');

    //load the user's options then update the modal element
    nnd._fn.load();
    nnd._fn.updateModal();

    //create the button in #leftcontrols or in the navbar. toggles the NND Chat modal window when clicked
    if ($("#toggleNND").length <= 0) {
      if (window.cytubeEnhanced) {
        $('<li/>').append($('<a/>',{href:'#',id:'toggleNND',text:'NND settings',click:(t)=>{t.preventDefault();t.stopPropagation();$('#nndSettingsModal').modal();}})).insertAfter($("#" + window.cytubeEnhanced.prefix + "ui").parent());
      } else {
        $('#leftcontrols').append($('<button/>',{id:'toggleNND','class':'btn btn-default btn-sm',html:'<span class="glyphicon glyphicon-cog"></span> NND Chat Settings',click:()=>$('#nndSettingsModal').modal()}));
      }
    }
    

    //create .videochatContainer which is basically an invisible container element. this holds the chat messages that will be scrolling by
    //TODO: maybe there's a better way to handle messages if "pointer-events: none" is used and the container is given 100%/100% size?
    $('.embed-responsive').prepend($('<div/>', {
        'class': 'videochatContainer'
    }));

    //once the message reaches the end of its CSS transition, remove it.
    //attached to #main just in case something happens with the container
    $('#main').on('transitionend', '.videochatContainer .videoText', function() {$(this).remove()});

    //attach addScrollingMessage to the chatMsg socket event
    //ignore messages sent by [server] and anything within CHANNEL.bots if defined
    socket.on('chatMsg', function(data) {
        if (IGNORED.indexOf(data.username) > -1) return;
        if (window.nnd.enabled && data.time >= Date.now() - 2000 && data.username.toLowerCase() !== '[server]' && (!CHANNEL.hasOwnProperty("bots") || (Array.isArray(CHANNEL.bots) && !~CHANNEL.bots.indexOf(data.username)))) {
            if (!data.meta['addClass'])
                data.meta['addClass'] = '';
            addScrollingMessage(data.msg, data.meta.addClass);
        }
    });

    //save user's settings on page unload so they are persistent
    $(window).unload(function() {window.nnd._fn.save()});
    
    $(document).on("visibilitychange", function() {
      if (document.visibilityState !== "visible") {
        $('.videoText').remove();
      }
    });
    
    console.debug('LOADED: NND chat script for cytu.be [https://github.com/deerfarce/cytube-nnd-chat]. Version '+nnd._ver);

})();

//the magic
//also ignores messages beginning with $ or !
//TODO: allow users to disable emotes in these messages
function addScrollingMessage(message, extraClass) {
    if (typeof window.nnd === "undefined") return;
    var opts = window.nnd;
    if (opts.MAX < 1 || isNaN(parseInt(opts.MAX))) opts.MAX = window.nnd.MAX = 100;
    if ($('.videoText').length >= opts.MAX && opts.MAX >= 1) return;
    if (opts.enabled && $('#ytapiplayer')[0] && document.visibilityState === "visible") {
        if (message !== null && typeof message === "string" && message.length > 0 && !(/^[\$\!]/.test(message))) {
            var topOffset = "0em";
            var frm = 'right';
            //if (message.length > 240) message = message.substring(0,240);
            if (!opts.fromRight) frm = 'left';
            //while ($('.videoText').length >= opts.MAX && opts.MAX >= 1) $('.videoText').eq(0).remove();
            var fontSize = window.nnd.fontSize;
            if (opts.offsetType === 1) topOffset = (Math.random() * 89) + '%'
            else {
                topOffset = (fontSize * Math.floor(Math.random() * (Math.floor($('#ytapiplayer').height() / fontSize)))) + 'px';
                if (opts.offsetType < 0 || opts.offsetType > 1) {
                    console.error('NNDchat: Unknown offsetType '+opts.offsetType+', reverting to 0');
                    window.nnd.offsetType = 0;
                }
            }
            var $txt = $('<div/>', {'class': 'videoText '+extraClass,style: 'visibility: hidden; top:'+topOffset+';'}).append(message);
            $('.videochatContainer').append($txt);
            $txt.css(frm, (0 - $txt.width())+'px');
            $txt.addClass('moving');
            $txt.css('visibility', 'visible');
            $txt.css(frm, $('#ytapiplayer').width()+'px');
        }
    } else return;
}