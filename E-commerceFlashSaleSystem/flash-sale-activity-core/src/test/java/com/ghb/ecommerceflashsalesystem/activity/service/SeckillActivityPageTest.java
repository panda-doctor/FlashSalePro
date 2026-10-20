package com.ghb.ecommerceflashsalesystem.activity.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ghb.ecommerceflashsalesystem.activity.cache.SeckillCacheService;
import com.ghb.ecommerceflashsalesystem.activity.mapper.SeckillActivityMapper;
import com.ghb.ecommerceflashsalesystem.activity.port.ProductCatalogPort;
import com.ghb.ecommerceflashsalesystem.activity.service.impl.SeckillActivityServiceImpl;
import com.ghb.ecommerceflashsalesystem.activity.vo.ActivityItemVO;
import com.ghb.ecommerceflashsalesystem.common.api.PageResponse;
import com.ghb.ecommerceflashsalesystem.common.exception.BusinessException;
import com.ghb.ecommerceflashsalesystem.domain.entity.SeckillActivity;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

/**
 * 管理端活动分页：验证分页元数据、商品信息批量补全与未预热库存回退。
 */
@ExtendWith(MockitoExtension.class)
class SeckillActivityPageTest {

    @Mock
    private SeckillActivityMapper seckillActivityMapper;

    @Mock
    private SeckillCacheService seckillCacheService;

    @Mock
    private ProductCatalogPort productCatalogPort;

    @InjectMocks
    private SeckillActivityServiceImpl seckillActivityService;

    @Test
    @DisplayName("分页返回活动与商品摘要，未预热时库存回退 DB 配置值")
    void pageMapsItemsAndMetadata() {
        SeckillActivity activity = new SeckillActivity();
        activity.setId(1001L);
        activity.setProductId(88L);
        activity.setActivityName("E2E 秒杀");
        activity.setStartTime(LocalDateTime.of(2026, 10, 20, 10, 0));
        activity.setEndTime(LocalDateTime.of(2026, 10, 20, 12, 0));
        activity.setSeckillPrice(199L);
        activity.setSeckillStock(5);
        activity.setLimitPerUser(1);
        activity.setStatus(0);

        Page<SeckillActivity> dbPage = new Page<>(2, 2);
        dbPage.setRecords(List.of(activity));
        dbPage.setTotal(5);
        when(seckillActivityMapper.selectPage(any(Page.class), any())).thenReturn(dbPage);
        when(productCatalogPort.findBriefs(anyCollection())).thenReturn(
                Map.of(88L, new ProductCatalogPort.ProductBrief(88L, "机械键盘", "/uploads/kb.png", 29900L)));
        when(seckillCacheService.isActivityCacheReady(1001L)).thenReturn(false);

        PageResponse<ActivityItemVO> result = seckillActivityService.pageActivities(2, 2, null, null);

        assertThat(result.getPage()).isEqualTo(2);
        assertThat(result.getPageSize()).isEqualTo(2);
        assertThat(result.getTotal()).isEqualTo(5);
        assertThat(result.getPages()).isEqualTo(3);
        assertThat(result.getRecords()).hasSize(1);

        ActivityItemVO item = result.getRecords().get(0);
        assertThat(item.getActivityId()).isEqualTo(1001L);
        assertThat(item.getProductName()).isEqualTo("机械键盘");
        assertThat(item.getOriginalPrice()).isEqualTo(29900L);
        assertThat(item.getStock()).isEqualTo(5);
        assertThat(item.getPreheated()).isFalse();
        assertThat(item.getTotalStock()).isEqualTo(5);
    }

    @Test
    @DisplayName("非法状态按参数错误拒绝，不落到系统错误")
    void invalidStatusRejected() {
        assertThatThrownBy(() -> seckillActivityService.pageActivities(1, 20, null, "UNKNOWN"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("无效的活动状态");
    }
}
