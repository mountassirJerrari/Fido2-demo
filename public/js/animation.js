let isAuthState = false
const toAuthenticationAnim =()=>{
    if (isAuthState) {
        gsap.to('#progress' , {x : '0%' , duration : 1  })
        gsap.to('.button_container' , {x : '0%' , duration : 1  })
        document.querySelector('.smalltxt').innerText = 'already have an account? connect'

    } else {
        gsap.to('#progress' , {x : '100%' , duration : 1  })
        gsap.to('.button_container' , {x : '-50%' , duration : 1  })
        document.querySelector('.smalltxt').innerText = ' don\'t have an account ? sign up '
    }
    isAuthState = !isAuthState
}