import Animate from "./animate.js"

function getElement(expr) {
	return (typeof expr === 'string') ? document.querySelector(expr) : expr
}

function getComputedStyle(el, key) {
	var computedStyle = window.getComputedStyle(el)
	return computedStyle[key] || ''
}

function easeOutCubic(pos) {
	return (Math.pow((pos - 1), 3) + 1)
}

function easeInOutCubic(pos) {
	if ((pos /= 0.5) < 1) {
		return 0.5 * Math.pow(pos, 3)
	}
	return 0.5 * (Math.pow((pos - 2), 3) + 2)
}
const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

class Scroll {
	constructor(container, options) {
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
		self.__isitSurePullup = true;
		self.__isEnd = false;
		self.__releaseRefresh = function() {};
		self.__releaseLoad = function() {}
		self.dpr = 1;
		options = options || {}
		self.options = {
			pulldown: options.pulldowncallBack || function() {},
			cancellablePulldown: options.cancellablePulldownCallBack || function() {},
			pullup: options.pullupcallBack || function() {},
			cancellablePullup: options.cancellablePullupCallBack || function() {},
			pulldownDelayed: options.pulldownDelayed || 500,
			pullupDelayed: options.pullupDelayed || 500,
			handleRefresh: options.handleRefresh || false,
			handleLoad: options.handleLoad || false,
			pulldownIngText: options.pulldownIngText || '',
			pulldownSureText: options.pulldownSureText || '',
			pulldownEndoutText: options.pulldownEndoutText || '',
			pullupIngText: options.pullupIngText || '',
			pullupSureText: options.pullupSureText || '',
			pullupEndoutText: options.pullupEndoutText || '',
		}

		self.__container = getElement(container)
		const component = self.__component = self.__container.querySelector("[data-role=component]")
		self.__pulldown = self.__container.querySelector("[data-role=pulldown]")
		self.__view = self.__container.querySelector("[data-role=view]")
		self.__pullup = self.__container.querySelector("[data-role=pullup]")
		self.__pulldownIcon = self.__container.querySelector("[data-role=pulldown-icon]")
		self.__pulldownText = self.__container.querySelector("[data-role=pulldown-text]")
		self.__pullupIcon = self.__container.querySelector("[data-role=pullup-icon]")
		self.__pullupText = self.__container.querySelector("[data-role=pullup-text]")
		self.__callback = function(top) {
			const distance = -top * self.dpr
			self.__component.style.webkitTransform = 'translate3d(0, ' + distance + 'px, 0)'
			self.__component.style.transform = 'translate3d(0, ' + distance + 'px, 0)'
		}
		self.__pulldownText.innerText = self.options.pulldownIngText;
		self.__pullupText.innerText = self.options.pullupIngText;
		self.refresh()

		const touchStartHandler = function(e) {
			if (e.target.tagName.match(/input|textarea|select/i)) {
				return
			}
			e.preventDefault()
			self.__TouchStart(e, e.timeStamp)
		}

		const touchMoveHandler = function(e) {
			self.__TouchMove(e, e.timeStamp)
		}

		const touchEndHandler = function(e) {
			self.__TouchEnd(e, e.timeStamp)
		}
		
		const willPreventDefault = true;
		component.addEventListener('touchstart', touchStartHandler, willPreventDefault)
		component.addEventListener('touchmove', touchMoveHandler, willPreventDefault)
		component.addEventListener('touchend', touchEndHandler, willPreventDefault)
		component.addEventListener('mousedown', touchStartHandler, willPreventDefault)
		component.addEventListener('mousemove', touchMoveHandler, willPreventDefault)
		component.addEventListener('mouseup', touchEndHandler, willPreventDefault)
		const observer = new MutationObserver(function(mutations) {
			self.refresh()
		});
		observer.observe(component, {
			childList: true,
			subtree: true,
		});
		function SelfDefine(selfClass,key,val){
			let tagDown = false;
			let tagUp = false;
			Object.defineProperty(selfClass,key,{
				set: function Setter(nvl){
					if(nvl !== val){
						val = nvl
						if(tagDown){
							tagDown = false
							self.__pulldownText.innerText = self.options.pulldownIngText
							self.__pulldownIcon.classList.remove("pulldownEndout")
							self.options.pulldown.call(self)
							if(self.__isEnd){
								self.options.cancellablePulldown.call(self)
							}
							
						}
						if(tagUp){
							self.__pullupText.innerText = self.options.pullupIngText
							self.__pullupIcon.classList.remove("pullupEndout")
							tagUp = false
							self.options.pullup.call(self)
							if(self.__isEnd){
								self.options.cancellablePullup.call(self)
							}
						}
						self.__pulldownRotlote(val)
					}
					
					if(val === self.__minScrollDistance){
						if(!tagDown){
							tagDown = true;
							self.__pulldownIcon.classList.add("onPulldown");
							self.__pulldownText.innerText = self.options.pulldownSureText
						}
						if(self.__isEnd){
							self.__pulldownIcon.classList.add("pulldownEndout")
							self.__pulldownText.innerText = self.options.pulldownEndoutText
						}	
					}
					if(val === self.__maxScrollDistance){
						if(!tagUp){
							tagUp = true;
							self.__pullupIcon.classList.add("onPullup")
							self.__pullupText.innerText = self.options.pullupSureText
						}
						if(self.__isEnd){
							self.__pullupIcon.classList.add("pullupEndout")
							self.__pullupText.innerText = self.options.pullupEndoutText
						}
					}
					
				},
				get: function Getter(){
					return val
				}
			})
		}
		SelfDefine(self,"__scrollPosition",self.__scrollPosition)
	}
	manualRefresh() {
		//对外暴露手动刷新方法
		return;
		const self = this;
		self.__scrollPosition = self.__minScrollDistance;
		self.__callback(self.__scrollPosition)
		self.__scrollTo(self.__scrollPosition)
	}
	releaseRefresh() {
		//对外暴露释放刷新的方法
		this.__releaseRefresh();
	}
	releaseLoad() {
		//对外暴露释放加载的方法
		this.__releaseLoad();
	}
	refresh() {
		const self = this;
		const rect = self.__component.getBoundingClientRect()
		const viewRect = self.__view.getBoundingClientRect()
		const pulldownRect = self.__pulldown.getBoundingClientRect()
		const pullupRect = self.__pullup.getBoundingClientRect()
		const root = self.__container.getBoundingClientRect()
		self.__setDimensions(root.height, viewRect.height, pulldownRect.height, pullupRect.height)
	}
	__scrollingComplete() {

	}
	__pulldownRotlote(angle) {
		const self = this;
		const min = self.__minDistance;
		const max = self.__maxDistance;
		const scrollmin = self.__minScrollDistance;
		const scrollmax = self.__maxScrollDistance;
		if(angle > min && angle < max)return;
		const rotateFn = function(rotate,dom){
			rotate = Math.abs(Math.round(rotate))*3.6
			self[dom].style.transform = "rotate(" + rotate + "deg)"
		}
		if ( angle <= min) {
			rotateFn(angle,"__pulldownIcon")
			return;
		}
		if( angle >= max ){
			rotateFn(angle-max,"__pullupIcon")
		}
		
	}
	__setDimensions(rootHeight, viewHeight, pulldownHeight, pullupHeight) {
		const self = this;
		self.__contentHeight = viewHeight
		self.__minDistance = 0
		self.__maxDistance = viewHeight - rootHeight
		self.__minScrollDistance = -pulldownHeight
		self.__maxScrollDistance = viewHeight - rootHeight + pullupHeight
		if (rootHeight > viewHeight) {
			//当内容高度小于容器高度，禁止上拉
			self.__isitSurePullup = false;
		}
	}
	__scrollTo(top, animate) {
		const self = this;
		if (self.__isDecelerating) {
			Animate.stop(self.__isDecelerating)
			self.__isDecelerating = false
		}
		top = Math.max(Math.min(self.__maxDistance, top), self.__minDistance)
		new Promise(res => {
			const down = self.__scrollPosition <= self.__minScrollDistance;
			const up = self.__scrollPosition >= self.__maxScrollDistance && self.__isitSurePullup;
			if (down || up) {
				new Promise(resolve => {
					if (down) {
						if (self.options.handleRefresh) {
							self.__releaseRefresh = resolve
						} else {
							setTimeout(resolve, self.options.pulldownDelayed)
						}
					}
					if (up) {
						if (self.options.handleLoad) {
							self.__releaseLoad = resolve
						} else {
							setTimeout(resolve, self.options.pullupDelayed)
						}
					}
				}).then(function() {
					res()
				})

			} else {
				res()
			}

		}).then(function() {
			self.__publish(top, 300);
		})

	}
	__TouchStart(ev, timeStamp) {
		const self = this;
		const touches = ev.touches;
		const target = ev.touches ? ev.touches[0] : ev;
		const isMobile = !!ev.touches;
		self.__isEnd = false;
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
		self.__noLonger = true;
	}
	__TouchMove(ev, timeStamp) {
		const self = this;
		const touches = ev.touches;
		const target = ev.touches ? ev.touches[0] : ev;
		const isMobile = !!ev.touches;
		const moveAddDistance = 100;
		if (!self.__isTracking) {
			return
		}
		var currentTouchPosition;
		if (isMobile && touches.length === 2) {
			currentTouchPosition = Math.abs(target.pageY + touches[1].pageY) / 2
		} else {
			currentTouchPosition = target.pageY
		}
		const positions = self.__positions;
		if (!self.__isitSurePullup && currentTouchPosition - self.__initialTouchPosition < 0) {
			return
		}

		if (self.__isDragging) {
			let moveDistance = currentTouchPosition - self.__lastTouchPosition;
			let scrollPosition = self.__scrollPosition;
			const minDistance = self.__minDistance;
			const maxDistance = self.__maxDistance;
			if (scrollPosition < minDistance || scrollPosition > maxDistance) {
				moveDistance = moveDistance / 3
			}
			if (self.__enableScrollPosition) {
				scrollPosition -= moveDistance;
				if (scrollPosition < 0) {
					//self.__pulldownRotlote(scrollPosition)
				}
				const minScrollDistance = self.__minScrollDistance //- moveAddDistance;
				const maxScrollDistance = self.__maxScrollDistance //+ moveAddDistance;
				if (scrollPosition < minScrollDistance) {
					scrollPosition = minScrollDistance;
				}
				if (scrollPosition > maxScrollDistance && self.__isitSurePullup) {
					scrollPosition = maxScrollDistance;
				}

				if (positions.length > 40) {
					positions.splice(0, 20)
				}
				positions.push(scrollPosition, timeStamp)
				self.__publish(scrollPosition)

			}
		} else {
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
	__TouchEnd(ev, timeStamp) {
		const self = this;
		const touches = ev.changedTouches;
		const target = ev.changedTouches ? ev.changedTouches[0] : ev;
		const isMobile = !!ev.changedTouches;

		if (!self.__isTracking) {
			return
		}
		self.__isTracking = false;
		self.__isEnd = true;
		var currentTouchPosition;
		if (isMobile && touches.length === 2) {
			currentTouchPosition = Math.abs(target.pageY + touches[1].pageY) / 2
		} else {
			currentTouchPosition = target.pageY
		}
		if (!self.__isitSurePullup && currentTouchPosition - self.__initialTouchPosition < 0) {
			return;
		}
		self.__scrollPosition = self.__scrollPosition;
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
	__startDeceleration(timeStamp) {
		var self = this

		var step = function() {
			self.__stepThroughDeceleration()
		}

		var minVelocityToKeepDecelerating = 0.5

		var verify = function() {
			var shouldContinue = Math.abs(self.__decelerationVelocity) >= minVelocityToKeepDecelerating;
			if (!shouldContinue) {
				self.__didDecelerationComplete = true
			}
			return shouldContinue
		}

		var completed = function(animationId, wasFinished) {
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
	__stepThroughDeceleration() {
		const self = this;
		var scrollDistance = self.__scrollPosition + self.__decelerationVelocity
		var scrollDistanceFixed = Math.max(Math.min(self.__maxScrollDistance, scrollDistance), self.__minScrollDistance)
		if (scrollDistanceFixed !== scrollDistance) {
			scrollDistance = scrollDistanceFixed
			self.__decelerationVelocity = 0
		}
		const minDistance = self.__minDistance;
		const maxDistance = self.__maxDistance;
		if (scrollDistance < minDistance || scrollDistance > maxDistance) {
			if (scrollDistance < minDistance) {
				//self.__pulldownRotlote(scrollDistance, "pullDown")
			}
			self.__decelerationVelocity *= 0.6
		}
		if (Math.abs(self.__decelerationVelocity) <= 0.5) {
			self.__decelerationVelocity = 0
		} else {
			self.__decelerationVelocity *= 0.95
		}

		self.__publish(scrollDistance)
	}
	__publish(top, animationDuration) {
		const self = this;
		const wasAnimating = self.__isAnimating
		if (animationDuration) {
			const oldDistance = self.__scrollPosition
			const diffDistance = top - oldDistance
			const step = function(percent) {
				self.__scrollPosition = oldDistance + (diffDistance * percent)
				if (self.__callback) {
					self.__callback(self.__scrollPosition)
				}
			}

			const verify = function(id) {
				return self.__isAnimating === id
			}

			const completed = function(animationId, wasFinished) {
				if (animationId === self.__isAnimating) {
					self.__isAnimating = false
				}
				if (self.__didDecelerationComplete || wasFinished) {
					self.__scrollingComplete()
				}
			}
			self.__isAnimating = Animate.start(step, verify, completed, animationDuration, wasAnimating ? easeOutCubic :
				easeInOutCubic)
		} else {
			self.__scrollPosition = top
			if (self.__callback) {
				self.__callback(top)
			}
		}
	}
}

export default Scroll;
