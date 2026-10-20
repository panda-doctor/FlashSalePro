package com.ghb.ecommerceflashsalesystem.product.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ghb.ecommerceflashsalesystem.common.api.PageResponse;
import com.ghb.ecommerceflashsalesystem.domain.entity.Product;
import com.ghb.ecommerceflashsalesystem.domain.enums.ProductStatusEnum;
import com.ghb.ecommerceflashsalesystem.product.cache.ProductCacheService;
import com.ghb.ecommerceflashsalesystem.product.mapper.ProductMapper;
import com.ghb.ecommerceflashsalesystem.product.service.impl.ProductServiceImpl;
import com.ghb.ecommerceflashsalesystem.product.vo.ProductVO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RedissonClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 管理端商品分页：含下架商品、状态过滤与分页元数据。
 */
@ExtendWith(MockitoExtension.class)
class AdminProductPageTest {

    @Mock
    private ProductMapper productMapper;

    @Mock
    private ProductCacheService productCacheService;

    @Mock
    private RedissonClient redissonClient;

    @InjectMocks
    private ProductServiceImpl productService;

    @Test
    @DisplayName("管理端分页可返回已下架商品，并带状态过滤条件")
    void pageIncludesOffShelfProducts() {
        Product onShelf = product(1L, "在售键盘", ProductStatusEnum.ON_SHELF);
        Product offShelf = product(2L, "下架鼠标", ProductStatusEnum.OFF_SHELF);
        Page<Product> dbPage = new Page<>(1, 20);
        dbPage.setRecords(List.of(onShelf, offShelf));
        dbPage.setTotal(2);
        when(productMapper.selectPage(any(Page.class), any())).thenReturn(dbPage);

        PageResponse<ProductVO> result = productService.pageProducts(1, 20, "键", ProductStatusEnum.OFF_SHELF);

        assertThat(result.getTotal()).isEqualTo(2);
        assertThat(result.getRecords()).extracting(ProductVO::getName)
                .containsExactly("在售键盘", "下架鼠标");
        assertThat(result.getRecords().get(1).getStatus()).isEqualTo(ProductStatusEnum.OFF_SHELF);

        ArgumentCaptor<com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Product>> captor =
                ArgumentCaptor.forClass(com.baomidou.mybatisplus.core.conditions.query.QueryWrapper.class);
        verify(productMapper).selectPage(any(Page.class), captor.capture());
        assertThat(captor.getValue().getSqlSegment()).contains("status").contains("name");
    }

    private Product product(Long id, String name, ProductStatusEnum status) {
        Product product = new Product();
        product.setId(id);
        product.setName(name);
        product.setOriginalPrice(9900L);
        product.setTotalStock(10);
        product.setAvailableStock(8);
        product.setStatus(status.getCode());
        return product;
    }
}
