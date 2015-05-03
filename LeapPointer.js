      var MIN_X = -300;
      var MAX_X = 300;
      var MIN_Y = 0;
      var MAX_Y = 600;
      
      var nextPointerId = 2;
      var pointerIdMap = [];
      
      window.PointerEvent = function(type, propertyBag) {
                this.TOUCH = "touch";
                this.MOUSE = "mouse";
                this.PEN = "pen";
                
                var event = document.createEvent("PointerEvent");
                event.initPointerEvent(type,
                                (propertyBag && propertyBag["bubbles"]) || false,
                                (propertyBag && propertyBag["cancelable"]) || false,
                                (propertyBag && propertyBag["view"]) || null,
                                (propertyBag && propertyBag["detail"]) || null,
                                (propertyBag && propertyBag["screenX"]) || 0,
                                (propertyBag && propertyBag["screenY"]) || 0,
                                (propertyBag && propertyBag["clientX"]) || 0,
                                (propertyBag && propertyBag["clientY"]) || 0,
                                (propertyBag && propertyBag["ctrlKey"]) || false,
                                (propertyBag && propertyBag["altKey"]) || false,
                                (propertyBag && propertyBag["shiftKey"]) || false,
                                (propertyBag && propertyBag["metaKey"]) || false,
                                (propertyBag && propertyBag["button"]) || 0,
                                (propertyBag && propertyBag["relatedTarget"]) || null,
                                (propertyBag && propertyBag["offsetX"]) || 0,
                                (propertyBag && propertyBag["offsetY"]) || 0,
                                (propertyBag && propertyBag["width"]) || 1,
                                (propertyBag && propertyBag["height"]) || 1,
                                (propertyBag && propertyBag["pressure"]) || 0.5,
                                (propertyBag && propertyBag["rotation"]) || 0,
                                (propertyBag && propertyBag["tiltX"]) || 0,
                                (propertyBag && propertyBag["tiltY"]) || 0,
                                (propertyBag && propertyBag["pointerId"]) || 0,
                                (propertyBag && propertyBag["pointerType"]) || "",
                                (propertyBag && propertyBag["hwTimestamp"]) || 0,
                                (propertyBag && propertyBag["isPrimary"]) || 0);
                return event;
}
      
      Leap.loop(function(frame) {
        console.log('loop');
        for (var pointableId = 0, pointableCount = frame.pointables.length; pointableId != pointableCount; pointableId++) {
          var pointable = frame.pointables[pointableId];

          if(pointable.valid) {
            
            //Get coordinates
            var x = pointable.tipPosition[0];
            var y = pointable.tipPosition[1];
            //Calibrate
            /*MIN_X = Math.min(MIN_X, x);
            MIN_Y = Math.min(MIN_Y, y);
            MAX_X = Math.max(MAX_X, x);
            MAX_Y = Math.max(MAX_Y, y);*/
            if(x < MIN_X || x > MAX_X || y < MIN_Y || y > MAX_Y)
                break;
            //Transform to screen (cheap method for now)
            var clientX = ((x - MIN_X)/(MAX_X - MIN_X))*window.screen.width;
            var clientY = window.screen.height - ((y - MIN_Y)/(MAX_Y - MIN_Y))*window.screen.height;
            
            //Get target element under pointer
            var target = document.elementFromPoint(clientX, clientY);
            if(!target)
                target = window;
            if(target.getBoundingClientRect) {
                var targetRect = target.getBoundingClientRect();
            }else{
                targetRect = {left: 0, top: 0, width: window.innerWidth, height: window.innerWidth};
            }
            
            //Assign a pointerId
            if(!pointerIdMap[pointable.id]) {
                //New pointer, assign a pointerId and fire pointerdown
                pointerIdMap[pointable.id] = nextPointerId++;
                var evt = new PointerEvent("pointerdown", { bubbles: true, 
                    cancelable: true, 
                    view: window, 
                    clientX: clientX, 
                    clientY: clientY, 
                    offsetX: clientX - targetRect.left,
                    offsetY: clientY - targetRect.top,
                    pointerType: "touch", 
                    pointerId: pointerIdMap[pointable.id]});
                target.dispatchEvent(evt);
            }
            //Construct and dispatch pointer event
            var evt = new PointerEvent("pointermove", { bubbles: true, 
                cancelable: true, 
                view: window, 
                clientX: clientX, 
                clientY: clientY, 
                offsetX: clientX - targetRect.left,
                offsetY: clientY - targetRect.top,
                pointerType: "touch", 
                pointerId: pointerIdMap[pointable.id]});
            target.dispatchEvent(evt);
            
            console.log("X: " + clientX + "   Y: " + clientY);
           }
        }
        
        if(pointableCount < Object.keys(pointerIdMap).length) {
            //A pointable has gone out of range, dispatch pointer up
            //Need to improve the efficiency of this later
            for(var pointableStringId in pointerIdMap) {
                var valid = false;
                for (var pointableId = 0, pointableCount = frame.pointables.length; pointableId != pointableCount; pointableId++) {
                    var pointable = frame.pointables[pointableId];
                    if(pointable.id === pointableStringId) {
                        valid = true;
                        break; //Still a valid pointer
                    }
                }
                if(!valid) {
                    //Construct and dispatch pointer event
                    var evt = new PointerEvent("pointerup", { bubbles: true, 
                        cancelable: true, 
                        view: window, 
                        clientX: 0, 
                        clientY: 0, 
                        offsetX: 0,
                        offsetY: 0,
                        pointerType: "touch", 
                        pointerId: pointerIdMap[pointableStringId]});
                    document.body.dispatchEvent(evt);
                    delete pointerIdMap[pointableStringId];
                }
            }
        }
      });