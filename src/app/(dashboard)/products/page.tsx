'use client';

import { useState, useEffect } from 'react';
import { getProducts, toggleProductStatus } from '@/actions/product.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ProductDialog } from '@/components/products/product-dialog';
import { Plus, Search, Edit2, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  async function fetchProducts() {
    setIsLoading(true);
    const result = await getProducts(search);
    if (result.success && result.data) {
      setProducts(result.data);
    } else {
      toast.error('Failed to load products');
    }
    setIsLoading(false);
  }

  async function handleToggleStatus(product: any) {
    const result = await toggleProductStatus(product.id, !product.isActive);
    if (result.success) {
      toast.success(`${product.name} is now ${!product.isActive ? 'Active' : 'Inactive'}`);
      fetchProducts();
    } else {
      toast.error(result.error);
    }
  }

  function handleEdit(product: any) {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }

  function handleAddNew() {
    setEditingProduct(null);
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex items-center relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} className={!product.isActive ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={product.stock <= product.lowStockThreshold ? 'destructive' : 'secondary'}>
                      {product.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.isActive ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleToggleStatus(product)}
                      title={product.isActive ? "Deactivate" : "Activate"}
                      className={product.isActive ? 'text-destructive' : 'text-green-600'}
                    >
                      {product.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProductDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) fetchProducts(); // Refresh list on close
        }}
        productToEdit={editingProduct} 
      />
    </div>
  );
}
