import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBy',
  standalone: true,
  pure: true // evita recalcular a menos que cambie la entrada
})
export class FilterByPipe implements PipeTransform {

  transform<T extends Record<string, any>>(items: T[], searchText: string, fields?: (keyof T | string)[]): T[] {

    if (!items) return [];
    if (!searchText) return items;
    
    searchText = searchText.toLowerCase();

    return items.filter(item => {
      if (fields && fields.length) {
        return fields.some(field => {
          const value = this.getNestedValue(item, field);
          return value?.toString().toLowerCase().includes(searchText);
        });
      } else {
        // Si no se especifica campo, busca en todo el objeto
        return Object.values(item).some(val => 
          val?.toString().toLowerCase().includes(searchText)
        );
      }
    });
  }

  private getNestedValue(obj: any, path: string | keyof any): any {
    return path.toString().split('.').reduce((acc, part) => acc && acc[part], obj);
  }

}
