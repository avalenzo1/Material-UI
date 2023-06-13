function isEmpty(variable) {
    return typeof variable !== 'undefined' && variable;
}

function supportsTouch() {
    return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
}

class MaterialIcon {
    constructor(icon) {
        console.log('<span class="material-icons">&#xe316;</span>');
    }
}

class Alert {

}

class Ripple extends HTMLElement {
    constructor() {
        super();

        this.shadow = this.attachShadow({
            mode: "open"
        });

		this.template = document.getElementById("ui-btn-template").content.cloneNode(true);
        
        this.shadow.appendChild(this.template);
    }

    connectedCallback() {
        this.parent = this.parentElement;

        if (isEmpty(this.parent)) {
            this.classList.add("ui-ripple");
        }

        this.listenElement();
    }
    
    get buttonTint() {
        return window.getComputedStyle(this).getPropertyValue('--ripple-tint');
    }
    
    get rippleFadeDelay() {
    	return Number(window.getComputedStyle(this).getPropertyValue('--ripple-duration'));
    }

    get bounds() {
        return this.getBoundingClientRect();
    }

    calcClient(e) {
        this.clientX = 0;
        this.clientY = 0;

        if (e.clientX || e.clientY) {
            this.clientX = e.clientX;
            this.clientY = e.clientY;
        }

        if (e.touches) {
            this.clientX = e.touches[0].clientX;
            this.clientY = e.touches[0].clientY;
        }
    }

    rippleEnter(e) {
        this.getRipplesNotLeave();

        this.calcClient(e);
        this.circle = document.createElement("span");
        this.diameter = Math.max(this.parent.clientWidth, this.parent.clientHeight);
        this.radius = this.diameter / 2;

        this.x = `${this.clientX - this.bounds.left - this.radius}px`;
        this.y = `${this.clientY - this.bounds.top - this.radius}px`;
        this.centerX = `${this.bounds.width / 2}px`;
        this.centerY = `${this.bounds.height / 2}px`;

        if (this.clientX === 0 && this.clientY === 0) {
            this.x = `${this.centerX - this.radius}px`;
            this.y = `${this.centerY - this.radius}px`;
        }

        this.circle.style.width = this.circle.style.height = `${this.diameter}px`;
        this.circle.style.left = this.x;
        this.circle.style.top = this.y;
        this.circle.classList.add("_ripple--enter");

        if (this.buttonTint) {
            this.circle.style.backgroundColor = `rgba(${this.buttonTint},0.25)`;
        }

        this.shadow.appendChild(this.circle);

        e.stopImmediatePropagation();
    }

    getRipplesNotLeave() {
        let ripples = this.shadow.querySelectorAll("._ripple--enter:not(._ripple--leave)");

        ripples.forEach((ripple) => {
            ripple.classList.add("_ripple--leave");
        });
    }

    rippleLeave(e) {
        setTimeout(() => {
            this.getRipplesNotLeave();
            this.removeRipples();
        }, this.rippleFadeDelay);

        e.stopImmediatePropagation();
    }

    removeRipples() {
        let ripples = this.shadow.querySelectorAll("._ripple--leave");

        ripples.forEach((ripple) => {
            ripple.addEventListener("animationend", function() {
                ripple.remove();
            });
        });
    }

    listenElement() {
        if (supportsTouch()) {
            this.addEventListener("touchstart", (e) => {
                this.rippleEnter(e);
            });

            this.addEventListener("touchend", (e) => {
                this.rippleLeave(e);
            });

            this.addEventListener("touchleave", (e) => {
                this.rippleLeave(e);
            });

            this.addEventListener("touchcancel", (e) => {
                this.rippleLeave(e);
            });

        } else {
            this.addEventListener("mousedown", (e) => {
                this.rippleEnter(e);
            });

            this.addEventListener("mouseup", (e) => {
                this.rippleLeave(e);
            });

            this.addEventListener("mouseleave", (e) => {
                this.rippleLeave(e);
            });
        }
    }
}

class Button extends HTMLButtonElement {
    constructor() {
        super();

        this.createElement();
    }

    createElement() {
        this.classList.add("ui-btn");
        this.ripple = document.createElement("ui-ripple");

        this.appendChild(this.ripple);
    }
}

window.customElements.define('ui-btn', Button, {
    extends: "button"
});
window.customElements.define('ui-ripple', Ripple);

class Sheet {
    constructor({
        id: id,
        dismissible: dismissible,
        title: title,
        body: body
    }) {
        this.id = id;
        this.title = title;
        this.body = body;

        const global = this;

        this.props = {
            dismissible: dismissible || false,
            draggable: true,
            positions: {
                mini: "mini",
                half: "half",
                full: "full"
            }
        };

        this.state = {
            dismissed: false,
            dragging: false,
            position: global.props.positions.half
        };

        this.createSheet();
        this.listenSheet();
    }

    createSheet() {
        this.sheetContainer = document.getElementById(this.id);

        this.sheet = document.createElement("div");
        this.sheet.classList.add("ui-sheet");

        this.sheetKnob = document.createElement("div");
        this.sheetKnob.classList.add("ui-sheet__draggable");

        this.sheetKnobHandle = document.createElement("div");
        this.sheetKnobHandle.classList.add("ui-sheet__knob");

        this.sheetKnob.appendChild(this.sheetKnobHandle);

        this.sheetHeader = document.createElement("div");
        this.sheetHeader.classList.add("ui-sheet__header");

        this.sheetNavbar = document.createElement("div");
        this.sheetNavbar.classList.add("ui-header");

        this.sheetNavbarTitleContainer = document.createElement("div");
        this.sheetNavbarTitleContainer.classList.add("ui-header__title");
        this.sheetNavbarTitle = document.createTextNode(this.title);
        this.sheetNavbarTitleContainer.append(this.sheetNavbarTitle);

        this.sheetNavbarActions = document.createElement("div");
        this.sheetNavbarActions.classList.add("ui-header__actions");

        this.actionDismiss = document.createElement("button");
        this.actionDismiss.setAttribute("is", "ui-btn");
        this.actionDismiss.classList.add("ui-btn");
        this.actionDismiss.setAttribute("color", "light");
        this.actionDismiss.setAttribute("rounded", true);
        this.actionDismiss.innerHTML = '<span class="material-symbols-sharp">close</span>';

        this.actionDismiss.onclick = () => {
            this.sheetState = {
                dismissed: true
            };
        };

        this.sheetNavbarActions.appendChild(this.actionDismiss);

        this.sheetNavbar.appendChild(this.sheetNavbarTitleContainer);
        this.sheetNavbar.appendChild(this.sheetNavbarActions);

        this.sheetHeader.appendChild(this.sheetKnob);
        this.sheetHeader.appendChild(this.sheetNavbar);

        this.sheetBody = document.createElement("div");
        this.sheetBody.classList.add("ui-sheet__body");
        this.sheetBody.appendChild(this.body);

        this.sheet.appendChild(this.sheetHeader);
        this.sheet.appendChild(this.sheetBody);

        this.sheetContainer.appendChild(this.sheet);
    }

    calcClient(e) {
        this.clientX = 0;
        this.clientY = 0;

        if (e.clientX || e.clientY) {
            this.clientX = e.clientX;
            this.clientY = e.clientY;
        }

        if (e.touches) {
            this.clientX = e.touches[0].clientX;
            this.clientY = e.touches[0].clientY;
        }
    }


    sheetStart(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        this.calcClient(e);
        this.knobStart(e);
        this.sheetState = {
            "dragging": true
        };
    }

    sheetMove(e) {
        e.stopImmediatePropagation();

        if (this.state.dragging) {
            this.calcClient(e);
            
            this.sheetPosition = this.clientY;
        }
    }

    sheetEnd(e) {
        e.stopImmediatePropagation();

        if (this.state.dragging) {
        this.sheetState = {
            "dragging": false
        };

        switch (this.state.position) {
            case this.props.positions.full:
                if (this.knobRange < 0.45) {
                    this.sheetState = {
                        position: "mini"
                    };
                } else if (this.knobRange < 0.90) {
                    this.sheetState = {
                        position: "half"
                    };
                } else {
                    this.sheetState = {
                        position: "full"
                    };
                }
                break;
            case this.props.positions.half:
                if (this.knobRange > 0.55) {
                    this.sheetState = {
                        position: "full"
                    };
                } else if (this.knobRange > 0.45) {
                    this.sheetState = {
                        position: "half"
                    };
                } else {
                    this.sheetState = {
                        position: "mini"
                    };
                }
                break;
            case this.props.positions.mini:
                if (this.knobRange > 0.45) {
                    this.sheetState = {
                        position: "full"
                    };
                } else if (this.knobRange > 0.10) {
                    this.sheetState = {
                        position: "half"
                    };
                } else {
                    this.sheetState = {
                        position: "mini"
                    };
                }
                break;
        }
        }
    }

    knobStart() {

        this.sheetBounds = this.sheet.getBoundingClientRect();
        this.knobOffsetTop = this.clientY - this.sheetBounds.top;
    }

    get knobRange() {
        this.sheetBounds = this.sheet.getBoundingClientRect();
        return 1 - ((this.sheetBounds.top + this.sheetKnob.clientHeight) / this.sheet.clientHeight);
    }

    set sheetState(state) {
        this.sheetBounds = this.sheet.getBoundingClientRect();

        if ("dragging" in state) {
            this.state.dragging = state.dragging;

            if (!state.dragging) {
                this.sheet.classList.add("ui-sheet--sliding");
            } else {
                this.sheet.classList.remove("ui-sheet--sliding");
            }
        }

        this.sheet.classList.remove("ui-sheet--full");
        this.sheet.classList.remove("ui-sheet--minimized");

        if ("position" in state) {
            this.state.position = state.position;
            this.sheet.classList.add("ui-sheet--sliding");

            switch (state.position) {
                case this.props.positions.full:
                    this.sheet.style.transform = `translate(0, 0)`;
                    this.sheet.classList.add("ui-sheet--full");
                    break;
                case this.props.positions.half:
                    this.sheet.style.transform = `translate(0, calc(50% - ${this.sheetKnob.clientHeight}px)`;
                    break;
                case this.props.positions.mini:
                    this.sheet.style.transform = `translate(0, calc(100% - ${this.sheetKnob.clientHeight}px)`;
                    this.sheet.classList.add("ui-sheet--minimized");
                    break;
            }
        }

        if ("dismissed" in state) {
            this.state.dismissed = state.dismissed;

            if (state.dismissed) {
                this.sheet.classList.add("ui-sheet--sliding");
                this.sheet.style.transform = `translate(0, 100%)`;
            } else {
                this.sheetState = {
                    position: "half"
                };
            }
        }
    }

    set sheetPosition(y) {
        this.clientY = y;

        this.sheet.style.transform = `translate(0, ${y - this.knobOffsetTop}px)`;
    }

    listenSheet() {
        this.sheetKnob.addEventListener("mousedown", (e) => {
            this.sheetStart(e);
        });

        this.sheetKnob.addEventListener("mouseup", (e) => {
            this.sheetEnd(e);
        });

        this.sheetNavbarTitleContainer.addEventListener("touchstart", (e) => {
            this.sheetStart(e);
        });

        this.sheetNavbarTitleContainer.addEventListener("touchend", (e) => {
            this.sheetEnd(e);
        });

        window.addEventListener("mouseup", (e) => {
            if (this.state.dragging) {
                this.sheetEnd(e);
            }
        });

        this.sheetKnob.addEventListener("touchstart", (e) => {
            this.sheetStart(e);
        });

        this.sheetKnob.addEventListener("touchend", (e) => {
            this.sheetEnd(e);
        });

        this.sheetKnob.addEventListener("touchcancel", (e) => {
            this.sheetEnd(e);
        });

        window.addEventListener("touchend", (e) => {
            this.sheetEnd(e);
        });

        window.addEventListener("mousemove", (e) => {
            this.sheetMove(e);
        });

        window.addEventListener("touchmove", (e) => {
            this.sheetMove(e);
        });

        this.sheetState = {
            "position": this.state.position
        };
    }
}



const sheetBody = document.getElementById("body-sheet").content.cloneNode(true);

const sheet = new Sheet({
    id: "sheet-0",
    title: "My Cart",
    body: sheetBody
});

const openSheet = document.getElementById("show-sheet");

openSheet.onclick = () => {
    sheet.sheetState = {
        dismissed: false
    };
};