import Animate from "./animate.js"
function getElement (expr) {
  return (typeof expr === 'string') ? document.querySelector(expr) : expr
}

function getComputedStyle (el, key) {
  var computedStyle = window.getComputedStyle(el)
  return computedStyle[key] || ''
}

function easeOutCubic (pos) {
  return (Math.pow((pos - 1), 3) + 1)
}

function easeInOutCubic (pos) {
  if ((pos /= 0.5) < 1) {
    return 0.5 * Math.pow(pos, 3)
  }
  return 0.5 * (Math.pow((pos - 2), 3) + 2)
}


	class Scroll{
		constructor(container, options){
			  const self = this;
				self.__minScrollDistance = 0;
				self.__maxScrollDistance = 0;
				self.__scrollPosition = 0;
				self.__isAnimating = false;
				self.__isDecelerating = false;
				self.__positions = null;
				self.__initialTouchPosition = 0;
				self.__lastTouchPosition = 0;
				self.__lastTouchMoveTimeStamp = 0;
				self.__isSingleTouch = false;
				self.__isTracking = false;
				self.__isDragging = false;
				self.__enableScrollPosition = false;
				self.__interruptedAnimation = false;
				self.__decelerationVelocity = 0;
				self.__didDecelerationComplete = false;
				self.value = "";
			  self.dpr = 1;
			  options = options || {}
			  self.options = {
			    itemClass: options.itemClass || 'scroller-item',
			    onSelect :options.onSelect||function(){},
			    defaultValue: options.defaultValue||0,
			    data: options.data||[]
			  }
			
			  self.__container = getElement(container)
			  const component = self.__container.querySelector("[data-role=component]")
				const pulldown = self.__container.querySelector("[data-role=pulldown]")
				const view = self.__container.querySelector("[data-role=view]")
				const pullup = self.__container.querySelector("[data-role=pullup]")
				
				
			  self.__callback = function (top) {
			    const distance = -top * self.dpr
			    component.style.webkitTransform = 'translate3d(0, ' + distance + 'px, 0)'
			    component.style.transform = 'translate3d(0, ' + distance + 'px, 0)'
			  }
				const rect = component.getBoundingClientRect()
			  const viewRect = view.getBoundingClientRect()
				const pulldownRect = pulldown.getBoundingClientRect()
			  const pullupRect = pullup.getBoundingClientRect()
				const root = self.__container.getBoundingClientRect()
				self.__setDimensions(root.height,viewRect.height,pulldownRect.height,pullupRect.height)
				self.__scrollPosition = 0;
			  const touchStartHandler = function (e) {
			    if (e.target.tagName.match(/input|textarea|select/i)) {
			      return
			    }
			    e.preventDefault()
			    self.__TouchStart(e, e.timeStamp)
			  }
			
			  const touchMoveHandler = function (e) {
			    self.__TouchMove(e, e.timeStamp)
			  }
			
			  const touchEndHandler = function (e) {
			    self.__TouchEnd(e.timeStamp)
			  }
				const willPreventDefault = true;
			  component.addEventListener('touchstart', touchStartHandler, willPreventDefault)
			  component.addEventListener('touchmove', touchMoveHandler, willPreventDefault)
			  component.addEventListener('touchend', touchEndHandler, willPreventDefault)
				component.addEventListener('mousedown', touchStartHandler, willPreventDefault)
				component.addEventListener('mousemove', touchMoveHandler, willPreventDefault)
				component.addEventListener('mouseup', touchEndHandler, willPreventDefault)
		}
		__scrollingComplete(){
			
		}
		__setDimensions (rootHeight,viewHeight,pulldownHeight,pullupHeight) {
			const self = this;
		  self.__contentHeight = viewHeight
			self.__minDistance = 0
			self.__maxDistance = viewHeight - rootHeight
		  self.__minScrollDistance = -pulldownHeight
		  self.__maxScrollDistance = viewHeight - rootHeight + pullupHeight
		}
		__scrollTo (top, animate) {
		  const self = this;
		  		
		  if (self.__isDecelerating) {
		    Animate.stop(self.__isDecelerating)
		    self.__isDecelerating = false
		  }
			top = Math.max(Math.min(self.__maxDistance, top), self.__minDistance)
			if(self.__scrollPosition <= self.__minScrollDistance){
				console.log("下拉")
			}
			if(self.__scrollPosition >= self.__maxScrollDistance){
				console.log("上拉")
			}
			
		  self.__publish(top, 300);
		  
		}
		__TouchStart(ev,timeStamp){
			const self = this;
			const touches = ev.touches;
			const target = ev.touches ? ev.touches[0] : ev;
			const isMobile = !!ev.touches;
			
			if (self.__isDecelerating) {
			  Animate.stop(self.__isDecelerating)
			  self.__isDecelerating = false
				self.__interruptedAnimation = true;
			}
			if (self.__isAnimating) {
			  Animate.stop(self.__isAnimating)
			  self.__isAnimating = false
				self.__interruptedAnimation = true
			}
			
			var currentTouchPosition;
			var isSingleTouch = (isMobile && touches.length === 1) || !isMobile;
			if (isSingleTouch) {
			  currentTouchPosition = target.pageY
			} else {
			  currentTouchPosition = Math.abs(target.pageY + touches[1].pageY) / 2
			}
			
			self.__positions = [];
			self.__initialTouchPosition = currentTouchPosition;
			self.__lastTouchPosition = currentTouchPosition;
			self.__lastTouchMoveTimeStamp = timeStamp;
			self.__isSingleTouch = isSingleTouch;
			self.__isTracking = true;
			self.__isDragging = !isSingleTouch;
			self.__enableScrollPosition = !isSingleTouch;
			self.__didDecelerationComplete = false;
		}
		__TouchMove(ev,timeStamp){
			const self = this;
			const touches = ev.touches;
			const target = ev.touches ? ev.touches[0] : ev;
			const isMobile = !!ev.touches;
			if(!self.__isTracking){
				return 
			}
			var currentTouchPosition;
			if (isMobile && touches.length === 2) {
			  currentTouchPosition = Math.abs(target.pageY + touches[1].pageY) / 2
			} else {
			  currentTouchPosition = target.pageY
			}
			const positions = self.__positions;
			
			if(self.__isDragging){
				let moveDistance = currentTouchPosition - self.__lastTouchPosition;
				let scrollPosition = this.__scrollPosition;
				const minDistance = self.__minDistance;
				const maxDistance = self.__maxDistance;
				if(scrollPosition < minDistance || scrollPosition > maxDistance){
					moveDistance = moveDistance/3
				}
				if(self.__enableScrollPosition){
					scrollPosition -= moveDistance;
					
					const minScrollDistance = self.__minScrollDistance;
					const maxScrollDistance = self.__maxScrollDistance;
					
					
					if(scrollPosition < minScrollDistance){
						scrollPosition = minScrollDistance;
					}
					if(scrollPosition > maxScrollDistance){
						scrollPosition = maxScrollDistance;
					}
					
					if (positions.length > 40) {
					  positions.splice(0, 20)
					}
					positions.push(scrollPosition, timeStamp)
					self.__publish(scrollPosition)
					
				}
			}else{
				const minimumTrackingForScroll = 0;
				const minimumTrackingForDrag = 5;
				const distance = Math.abs(currentTouchPosition - self.__initialTouchPosition);
							
				self.__enableScrollPosition = distance >= minimumTrackingForScroll
				positions.push(self.__scrollPosition, timeStamp)
				
				self.__isDragging = self.__enableScrollPosition && (distance >= minimumTrackingForDrag)
				
				
				
			}
			
			
			self.__lastTouchMoveTimeStamp = timeStamp;
			self.__lastTouchPosition = currentTouchPosition;
		}
		__TouchEnd(timeStamp){
			const self = this;
			if (!self.__isTracking) {
			  return
			}
			self.__isTracking = false;
			
			if (self.__isDragging) {
				self.__isDragging = false;
				if (self.__isSingleTouch && (timeStamp - self.__lastTouchMoveTimeStamp) <= 100) {
					const positions = self.__positions;
					const endPos = positions.length - 1;
					let startPos = endPos;
			
					for (let i = endPos; i > 0 && positions[i] + 100 > self.__lastTouchMoveTimeStamp; i -= 2) {
					  startPos = i
					}
					if (startPos !== endPos) {
					  const timeOffset = positions[endPos] - positions[startPos];
					  
					  const movedDistance = self.__scrollPosition - positions[startPos - 1]
					  self.__decelerationVelocity = movedDistance / timeOffset * (1000 / 60)
					  const minVelocityToStartDeceleration = 4
					  if (Math.abs(self.__decelerationVelocity) > minVelocityToStartDeceleration) {
					    self.__startDeceleration(timeStamp)
					  }
					}
				}
			}
			
			
			if (!self.__isDecelerating) {
			  self.__scrollTo(self.__scrollPosition)
			}
			
		}
		__startDeceleration (timeStamp) {
			var self = this
			
			var step = function () {
			  self.__stepThroughDeceleration()
			}
			
			var minVelocityToKeepDecelerating = 0.5
			
			var verify = function () {
			  var shouldContinue = Math.abs(self.__decelerationVelocity) >= minVelocityToKeepDecelerating;
			  if (!shouldContinue) {
			    self.__didDecelerationComplete = true
			  }
			  return shouldContinue
			}
			
			var completed = function (animationId, wasFinished) {
			  self.__isDecelerating = false
			  if (self.__scrollPosition <= self.__minDistance || self.__scrollPosition >= self.__maxDistance) {
			    self.__scrollTo(self.__scrollPosition)
			    return
			  }
			  if (self.__didDecelerationComplete) {
					self.__scrollingComplete()
			  }
			}
			
			self.__isDecelerating = Animate.start(step, verify, completed)
		}
		__stepThroughDeceleration(){
			const self = this;
			var scrollDistance = self.__scrollPosition + self.__decelerationVelocity
			var scrollDistanceFixed = Math.max(Math.min(self.__maxScrollDistance, scrollDistance), self.__minScrollDistance)
			if (scrollDistanceFixed !== scrollDistance) {
			  scrollDistance = scrollDistanceFixed
			  self.__decelerationVelocity = 0
			}
			const minDistance = self.__minDistance;
			const maxDistance = self.__maxDistance;
			if(scrollDistance < minDistance || scrollDistance > maxDistance){
				self.__decelerationVelocity *= 0.6
			}
			if (Math.abs(self.__decelerationVelocity) <= 0.5) {
			  self.__decelerationVelocity = 0
			} else {
			  self.__decelerationVelocity *= 0.95
			}
			
			self.__publish(scrollDistance)
		}
		__publish(top,animationDuration){
			const self = this;
			var wasAnimating = self.__isAnimating
			if(animationDuration){
					var oldDistance = self.__scrollPosition
				var diffDistance = top - oldDistance
				
				var step = function (percent) {
				  self.__scrollPosition = oldDistance + (diffDistance * percent)
				  // Push values out
				  if (self.__callback) {
				    self.__callback(self.__scrollPosition)
				  }
				}
				
				var verify = function (id) {
				  return self.__isAnimating === id
				}
				
				var completed = function ( animationId, wasFinished) {
				  if (animationId === self.__isAnimating) {
				    self.__isAnimating = false
				  }
					 if (self.__didDecelerationComplete || wasFinished) {
						
						self.__scrollingComplete()
					}
				}
				self.__isAnimating = Animate.start(step, verify, completed, animationDuration, wasAnimating ? easeOutCubic : easeInOutCubic)
			}else{
				self.__scrollPosition = top
				if (self.__callback) {
				  self.__callback(top)
				}
			}
		}
	}

export default Scroll;