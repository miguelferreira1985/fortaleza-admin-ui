import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export class CustomValidators {


    /** Precio debe ser mayor o igual al costo */
    static priceGteCost: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        const cost = group.get('cost')?.value;
        const price = group.get('price')?.value;
        if (cost == null || price == null) return null;
        return Number(price) >= Number(cost) ? null: { priceLtCost: true };
    };

    /** Stock nuevo no puede ser negativo */
    static nonNegativeStock: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
        const newStock =  group.get('newStock')?.value;
        if (newStock == null) return null;
        return newStock >= 0? null : { negativeStock: true };
    };

    /** Cantidad debe ser distinta de 0 */
    static nonZeroQuantity: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        return value && value != 0 ? null : { zeroQuantity: true };
    };

    /** Minimum 1 item selected validation */
    static minSelected(min: number): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
        const val = control.value;
        const length = Array.isArray(val) ? val.length : (val ? 1 : 0);
        return length >= min ? null: { minimumSelected: { required: min, actual: length } };
      };
    }

    /** Confirm password */
    static matchFields(primary: string, confirm: string): ValidatorFn {
      return (group: AbstractControl): ValidationErrors | null => {
        const p = group.get(primary);
        const c = group.get(confirm);
        const pv = p?.value;
        const cv = c?.value;
  
        if (!p || !c) return null;
  
        const existing = c.errors ?? {};
        if (existing['passwordMismatch']) {
          const { passwordMismatch, ...rest } = existing;
          c.setErrors(Object.keys(rest).length ? rest : null);
        }
  
        if (pv === cv) return null;
  
        c.setErrors({ ...(c.errors ?? {}), passwordMismatch: true });
        return { passwordMismatch: true };
      };
    }
}