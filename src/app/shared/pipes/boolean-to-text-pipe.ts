import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'booleanToText'
})
export class BooleanToTextPipe implements PipeTransform {

  transform(value: boolean): string {
    if (value === true) {
      return 'SI';
    } else {
      return 'NO';
    }
  }

}
