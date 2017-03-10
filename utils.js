(function(global){

  var utils = {
    VERSION : '0.0.2',
    pixelInputToGLCoord: function(event, canvas) {
      var x = event.clientX,
        y = event.clientY,
        midX = canvas.width/2,
        midY = canvas.height/2,
        rect = event.target.getBoundingClientRect();
      x = ((x - rect.left) - midX) / midX;
      y = (midY - (y - rect.top)) / midY;
      return {x:x,y:y};
    },
    pixelInputToCanvasCoord: function(event, canvas) {
      var x = event.clientX,
        y = event.clientY,
        rect = event.target.getBoundingClientRect();
      x = x - rect.left;
      y = rect.bottom - y;
      return {x:x,y:y};
    },
    fade: function(element){
      var op = 1;  // initial opacity
      var timer = setInterval(function () {
          if (op <= 0.1){
              clearInterval(timer);
              element.style.display = 'none';
          }
          element.style.opacity = op;
          element.style.filter = 'alpha(opacity=' + op * 100 + ")";
          op -= op * 0.1;
      }, 50);
    }
  };


  // Expose uiUtils globally
  global.utils = utils;

}(window || this));