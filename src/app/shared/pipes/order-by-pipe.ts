import { isStandalone, Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: 'orderby'
})
export class OrderByPipe implements PipeTransform {

    transform<T>(value: T[] | null | undefined, field: string, direction: 'asc' | 'desc' = 'asc'): T[] {
        if (!Array.isArray(value) || !field) {
            return value ?? [];
        }

        const sorted = [...value].sort((a: any, b: any) => {
            const aVal = this.resolvedField(a, field);
            const bVal = this.resolvedField(b, field);

            if (aVal == null && bVal == null) { return 0; }
            if (aVal == null) { return 1; }
            if (bVal == null) { return -1; }

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return aVal - bVal;
            }

            if (aVal instanceof Date && bVal instanceof Date) {
                return aVal.getTime() - bVal.getTime();
            }

            return String(aVal).localeCompare(String(bVal), 'es', { sensitivity: 'base' });
        });

        return direction === 'asc' ? sorted : sorted.reverse();
    }

    private resolvedField(obj: any, path: string): any {
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    }

}