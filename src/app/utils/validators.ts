import { AbstractControl } from "@angular/forms";

export class MyValidators {

    static validPassword(control: AbstractControl) {
        const value = control.value;
        if (!containsNumber(value)) {
            return { invalid_password: true };
        }
        return null;
    }

    // static matchPassword (control: AbstractControl){
    //     const password = control.get('password').value;
    //     const confirmPassword = control.get('confirmPassword').value;
    //     if (password ===confirmPassword){
    //         return null;
    //     }
    //     return {math_password: true};
    // }

}

// funciones javascript
function containsNumber(value: string) {
    return value.split('').find(v => inNumber(v)) !== undefined;
}

function inNumber(value: string) {
    return !isNaN(parseInt(value, 10));
}

