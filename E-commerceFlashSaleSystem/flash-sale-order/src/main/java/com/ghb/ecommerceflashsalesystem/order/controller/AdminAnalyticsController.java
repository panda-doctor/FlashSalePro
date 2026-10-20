package com.ghb.ecommerceflashsalesystem.order.controller;

import com.ghb.ecommerceflashsalesystem.common.api.Result;
import com.ghb.ecommerceflashsalesystem.order.service.AdminAnalyticsService;
import com.ghb.ecommerceflashsalesystem.order.vo.AdminOverviewVO;
import com.ghb.ecommerceflashsalesystem.order.vo.SnapshotPointVO;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 管理端经营看板：订单汇总、趋势、活动 Top5 与单活动快照趋势。
 * 聚合只读，不写任何业务表。
 */
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/analytics")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping("/overview")
    public Result<AdminOverviewVO> overview(
            @RequestParam(defaultValue = "7") @Min(1) @Max(30) int days) {
        return Result.success(adminAnalyticsService.overview(days));
    }

    @GetMapping("/activities/{activityId}/snapshots")
    public Result<List<SnapshotPointVO>> snapshots(
            @PathVariable Long activityId,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int limit) {
        return Result.success(adminAnalyticsService.snapshots(activityId, limit));
    }
}
