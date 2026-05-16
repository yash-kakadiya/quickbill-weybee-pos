'use client';

import { useState, useEffect } from 'react';
import { getProducts, toggleProductStatus } from '@/actions/product.actions';
import { smartSearchProducts } from '@/actions/ai.actions';
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
import { Plus, Search, Edit2, Power, PowerOff, Sparkles, Loader2, X, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-states/empty-state';
import { ProductDetailsDialog } from '@/components/pos/product-details-dialog';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    if (!activeFilters) {
      const delayDebounce = setTimeout(() => {
        fetchProducts();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [search, activeFilters]);

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

  async function handleSmartSearch() {
    if (!search.trim()) {
      toast.error('Please enter a search term for AI');
      return;
    }
    setIsSmartSearching(true);
    setIsLoading(true);
    
    const res = await smartSearchProducts(search);
    if (res.success && res.data) {
      setProducts(res.data);
      setActiveFilters(res.filtersUsed);
      toast.success('Smart Search applied!');
    } else {
      toast.error(res.error || 'Smart Search failed');
    }
    
    setIsSmartSearching(false);
    setIsLoading(false);
  }

  function clearSmartSearch() {
    setActiveFilters(null);
    setSearch('');
  }

  async function handleToggleStatus(product: any, e: React.MouseEvent) {
    e.stopPropagation();
    const result = await toggleProductStatus(product.id, !product.isActive);
    if (result.success) {
      toast.success(`${product.name} is now ${!product.isActive ? 'Active' : 'Inactive'}`);
      fetchProducts();
    } else {
      toast.error(result.error);
    }
  }

  function handleEdit(product: any, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingProduct(product);
    setIsDialogOpen(true);
  }

  function handleAddNew() {
    setEditingProduct(null);
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ProductDetailsDialog 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onEdit={(product) => {
          setEditingProduct(product);
          setIsDialogOpen(true);
        }}
        onToggleStatus={async (product) => {
          const result = await toggleProductStatus(product.id, !product.isActive);
          if (result.success) {
            toast.success(`${product.name} is now ${!product.isActive ? 'Active' : 'Inactive'}`);
            fetchProducts();
            // Optional: You could update selectedProduct here to reflect the change immediately in the closed popup state, 
            // but closing it is standard UX for a state-changing action.
          } else {
            toast.error(result.error);
          }
        }}
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your inventory and pricing.</p>
        </div>
        <Button onClick={handleAddNew} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products natively or use Smart Search..."
              className="pl-9 bg-card shadow-sm transition-all focus-visible:ring-primary"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (activeFilters) setActiveFilters(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSmartSearch();
              }}
            />
          </div>
          <Button onClick={handleSmartSearch} disabled={isSmartSearching || isLoading} variant="secondary" className="w-full sm:w-auto shadow-sm whitespace-nowrap bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400">
            {isSmartSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />}
            Smart Search
          </Button>
        </div>
        
        {activeFilters && (
          <div className="flex items-center gap-2 flex-wrap bg-card p-2 rounded-md border shadow-sm animate-in slide-in-from-top-2">
            <span className="text-sm text-muted-foreground font-medium ml-1">AI Filters applied:</span>
            {Object.entries(activeFilters).map(([key, val]) => {
              if (val === undefined || val === null || val === 'any' || val === '') return null;
              return (
                <Badge key={key} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {key}: {val as string}
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" onClick={clearSmartSearch} className="h-6 px-2 text-xs ml-auto">
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="whitespace-nowrap">SKU</TableHead>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap">Category</TableHead>
                <TableHead className="text-right whitespace-nowrap">Price</TableHead>
                <TableHead className="text-right whitespace-nowrap">Stock</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center p-0">
                    <EmptyState 
                      icon={PackageOpen}
                      title="No products found"
                      description="You haven't added any products yet, or no products match your search criteria."
                      actionLabel="Add Product"
                      onAction={handleAddNew}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className={`hover:bg-muted/40 transition-colors cursor-pointer ${!product.isActive ? 'opacity-60 bg-muted/20' : ''}`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal bg-background">
                        {product.category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`font-medium ${product.stock <= product.lowStockThreshold ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' : 'bg-muted text-foreground'}`}>
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 font-medium">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground font-medium">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => handleEdit(product, e)} title="Edit" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleToggleStatus(product, e)}
                          title={product.isActive ? "Deactivate" : "Activate"}
                          className={`h-8 w-8 ${product.isActive ? 'hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30' : 'hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30'}`}
                        >
                          {product.isActive ? <PowerOff className="h-4 w-4 text-rose-500" /> : <Power className="h-4 w-4 text-emerald-500" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ProductDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) fetchProducts();
        }}
        productToEdit={editingProduct} 
      />
    </div>
  );
}
