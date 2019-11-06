function checkForm(type)
{
    setPageLoading(true);

    const formCheckers = {
        register: checkRegisterForm,
        login: checkLoginForm,
        contact: checkContactForm
    }
    
    var result;
    
    if (!(type in formCheckers))
    {
        console.warn("Could not check form, the form type " + type + " does not exist.");
        result = false;
    }
    else
    {
        result = formCheckers[type]()
    }

    setPageLoading(result);
    return result;
}

function checkRegisterForm()
{
    var check = document.getElementById("input-password");
    var checkTest = document.getElementById("input-password-check");

    if (!check.value)
    {
        check.classList.add("input-problem");
        return false;
    }
    else if (check.value != checkTest.value)
    {
        check.classList.add("input-problem");
        checkTest.classList.add("input-problem");
        return false;
    }

    return true;
}

function checkLoginForm() 
{
    return true;
}

function checkContactForm() 
{
    return true;
}

function setPageLoading(loading) 
{
    document.getElementById("screen-fader").setAttribute("disabled", !loading);
    document.getElementById("page-loading-indicator").setAttribute("disabled", !loading);
}