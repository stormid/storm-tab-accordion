/**
 * @name storm-tab-accordion: Tab and accordion ui component for multi-panelled content areas
 * @version 0.5.0: Mon, 13 Mar 2017 12:52:27 GMT
 * @author mjbp
 * @license MIT
 */
const KEY_CODES = {
		SPACE: 32,
		ENTER: 13,
		TAB: 9,
		LEFT: 37,
		RIGHT: 39,
		UP:38,
		DOWN: 40
	},
	defaults = {
		tabClass: '.js-tab-accordion-tab',
		titleClass: '.js-tab-accordion-title',
		currentClass: 'active',
		active: 0,
		tabCursorEvent: 'click'
	},
	StormTabAccordion = {
		init() {
			let hash = location.hash.slice(1) || null;
			this.tabs = [].slice.call(this.DOMElement.querySelectorAll(this.settings.tabClass));
			this.titles = [].slice.call(this.DOMElement.querySelectorAll(this.settings.titleClass));

			this.targets = this.tabs.map(el => {
				return document.getElementById(el.getAttribute('href').substr(1)) || console.error('Tab target not found');
			});
				
			this.current = this.settings.active;
			if (hash) {
				this.targets.forEach((target, i) => {
					if (target.getAttribute('id') === hash) {
						this.current = i;
					}
				});
			}
			this.initAria();
			this.initTitles();
			this.initTabs();
			this.open(this.current);

			return this;
		},
		initAria() {
			this.tabs.forEach(el => {
				el.setAttribute('role', 'tab');
				el.setAttribute('tabIndex', 0);
				el.setAttribute('aria-expanded', false);
				el.setAttribute('aria-selected', false);
				el.setAttribute('aria-controls', el.getAttribute('href') ? el.getAttribute('href').substr(1) : el.parentNode.getAttribute('id'));

			});
			this.targets.forEach(el => {
				el.setAttribute('role', 'tabpanel');
				el.setAttribute('aria-hidden', true);
				el.setAttribute('tabIndex', '-1');
			});
			return this;
		},
		initTitles() {
			let handler = i => {
				this.toggle(i);
			};

			this.titles.forEach((el, i) => {
				el.addEventListener(this.settings.tabCursorEvent, e => {
					if(!!e.keyCode && e.keyCode === KEY_CODES.TAB) return;

					if(!e.keyCode || e.keyCode === KEY_CODES.ENTER){
						e.preventDefault();
						handler.call(this, i);
					}
				}, false);
			});

			return this;
		},
		initTabs() {
			let handler = i => {
				this.toggle(i);
			};

			this.lastFocusedTab = 0;

			this.tabs.forEach((el, i) => {
				//navigate
				el.addEventListener('keydown', e => {
					switch (e.keyCode) {
					case KEY_CODES.UP:
						e.preventDefault();
						this.toggle((this.current === 0 ? this.tabs.length - 1 : this.current - 1));
						window.setTimeout(() => { this.tabs[this.current].focus(); }, 16);
						break;
					case KEY_CODES.LEFT:
						this.toggle((this.current === 0 ? this.tabs.length - 1 : this.current - 1));
						window.setTimeout(() => { this.tabs[this.current].focus(); }, 16);
						break;
					case KEY_CODES.DOWN:
						e.preventDefault();
						this.toggle((this.current === this.tabs.length - 1 ? 0 : this.current + 1));
						window.setTimeout(() => { this.tabs[this.current].focus(); }, 16);
						break;
					case KEY_CODES.RIGHT:
						this.toggle((this.current === this.tabs.length - 1 ? 0 : this.current + 1));
						window.setTimeout(() => { this.tabs[this.current].focus(); }, 16);
						break;
					case KEY_CODES.ENTER:
						handler.call(this, i);  
						window.setTimeout(() => { this.tabs[i].focus(); }, 16);
						break;
					case KEY_CODES.SPACE:
						e.preventDefault();
						this.toggle(i);
						window.setTimeout(() => { this.tabs[i].focus(); }, 16);
						break;
					case KEY_CODES.TAB:
						e.preventDefault();
						e.stopPropagation();
						this.lastFocusedTab = this.getTabIndex(e.target);
						this.setTargetFocus(this.lastFocusedTab);
						handler.call(this, i);
						break;
					default:
							//
						break;
					}
				});

				//toggle
				el.addEventListener('click', e => {
					e.preventDefault();
					handler.call(this, i);  
				}, false);
			});

			return this;
		},
		getTabIndex(link){
			for(let i = 0; i < this.tabs.length; i++){
				if(link === this.tabs[i]) return i;
			}
			return null;
		},
		getFocusableChildren(node) {
			let focusableElements = ['a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', 'iframe', 'object', 'embed', '[contenteditable]', '[tabIndex]:not([tabIndex="-1"])'];
			return [].slice.call(node.querySelectorAll(focusableElements.join(',')));
		},
		setTargetFocus(tabIndex){
			this.focusableChildren = this.getFocusableChildren(this.targets[tabIndex]);
			
			if(this.focusableChildren.length){
				window.setTimeout(function(){
					this.focusableChildren[0].focus();
					this.keyEventListener = this.keyListener.bind(this);
					document.addEventListener('keydown', this.keyEventListener);
				}.bind(this), 0);
			}
		},
		keyListener(e){
			if (e.keyCode !== KEY_CODES.TAB) return;
			
			let focusedIndex = this.focusableChildren.indexOf(document.activeElement);
			
			if(focusedIndex < 0) {
				document.removeEventListener('keydown', this.keyEventListener);
				return;
			}
			
			if(e.shiftKey && focusedIndex === 0) {
				e.preventDefault();
				this.focusableChildren[this.focusableChildren.length - 1].focus();
			} else {
				if(!e.shiftKey && focusedIndex === this.focusableChildren.length - 1) {
					document.removeEventListener('keydown', this.keyEventListener);
					if(this.lastFocusedTab !== this.tabs.length - 1) {
						e.preventDefault();
						this.lastFocusedTab = this.lastFocusedTab + 1;
						this.tabs[this.lastFocusedTab].focus();
					}
					
				}
			}
		},
		change(type, i) {
			let methods = {
				open: {
					classlist: 'add',
					tabIndex: {
						target: this.targets[i],
						value: '0'
					}
				},
				close: {
					classlist: 'remove',
					tabIndex: {
						target: this.targets[this.current],
						value: '-1'
					}
				}
			};

			this.tabs[i].classList[methods[type].classlist](this.settings.currentClass);
			this.titles[i].classList[methods[type].classlist](this.settings.currentClass);
			this.targets[i].classList[methods[type].classlist](this.settings.currentClass);

			this.targets[i].setAttribute('aria-hidden', this.targets[i].getAttribute('aria-hidden') === 'true' ? 'false' : 'true');
			this.tabs[i].setAttribute('aria-selected', this.tabs[i].getAttribute('aria-selected') === 'true' ? 'false' : 'true');
			this.tabs[i].setAttribute('aria-expanded', this.tabs[i].getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
			methods[type].tabIndex.target.setAttribute('tabIndex', methods[type].tabIndex.value);
			
		},
		open(i) {
			this.change('open', i);
			this.current = i;
			return this;
		},
		close(i) {
			this.change('close', i);
			return this;
		},
		toggle(i) {
			if(this.current === i) { return; }
			
			!!window.history.pushState && window.history.pushState({ URL: this.tabs[i].getAttribute('href') }, '', this.tabs[i].getAttribute('href'));
			if(this.current === null) { 
				this.open(i);
				return this;
			}
			this.close(this.current)
				.open(i);
			return this;
		}
	};

const init = (sel, opts) => {
	let els = [].slice.call(document.querySelectorAll(sel));
	
	if(!els.length) throw new Error('Tab Accordion cannot be initialised, no augmentable elements found');

	return els.map((el) => {
		return Object.assign(Object.create(StormTabAccordion), {
			DOMElement: el,
			settings: Object.assign({}, defaults, opts)
		}).init();
	});
};

export default { init };